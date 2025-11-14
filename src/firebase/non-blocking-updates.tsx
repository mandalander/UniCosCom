'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  runTransaction,
  Firestore,
  Transaction,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  setDoc(docRef, data, options || {}).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: operation,
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}

/**
 * Initiates a Firestore transaction to handle voting logic.
 * Wraps runTransaction to provide a more specific error on failure.
 */
export function runVoteTransaction(
    db: Firestore, 
    transactionBody: (transaction: Transaction) => Promise<any>,
    errorContext: SecurityRuleContext
): Promise<void> {
    return runTransaction(db, transactionBody).catch(serverError => {
        // Check if the error is likely a permission error
        if (serverError && (serverError.code === 'permission-denied' || serverError.code === 'unauthenticated')) {
             // Create and emit the detailed, contextual error
            const permissionError = new FirestorePermissionError(errorContext);
            errorEmitter.emit('permission-error', permissionError);
            // We still throw the original error so the UI can revert state,
            // but the important part is that the contextual error was emitted.
            throw permissionError;
        }
        
        // For other types of errors, re-throw a generic error
        console.error("Vote transaction failed with a non-permission error: ", serverError);
        throw new Error("Wystąpił błąd podczas zapisywania głosu. Spróbuj ponownie.");
    });
}
