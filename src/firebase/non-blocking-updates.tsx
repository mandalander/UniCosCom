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
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  return setDoc(docRef, data, options || {}).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: operation,
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // IMPORTANT: Reject the promise to allow the caller to handle the failure.
    return Promise.reject(permissionError);
  })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise so the caller can chain .then() or .catch().
 */
export function addDocumentNonBlocking(colRef: CollectionReference<DocumentData>, data: any): Promise<DocumentReference<DocumentData>> {
  return addDoc(colRef, data).catch(error => {
    // Create the rich, contextual error.
    const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
    });
    // Emit the error with the global error emitter.
    errorEmitter.emit('permission-error', permissionError);
    // IMPORTANT: Reject the promise to allow the caller to handle the failure.
    return Promise.reject(permissionError);
  });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  return updateDoc(docRef, data)
    .catch(error => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
       // IMPORTANT: Reject the promise to allow the caller to handle the failure.
      return Promise.reject(permissionError);
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  return deleteDoc(docRef)
    .catch(error => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
       // IMPORTANT: Reject the promise to allow the caller to handle the failure.
      return Promise.reject(permissionError);
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
): Promise<any> {
    return runTransaction(db, transactionBody).catch(serverError => {
        // Check if the error is likely a permission error
        if (serverError && (serverError.code === 'permission-denied' || serverError.code === 'unauthenticated')) {
             // Create and emit the detailed, contextual error
            const permissionError = new FirestorePermissionError(errorContext);
            errorEmitter.emit('permission-error', permissionError);
            
            // IMPORTANT: Reject the promise so that the calling UI can revert its state.
            return Promise.reject(permissionError);
        }
        
        // For other types of errors, re-throw the original error to be handled by the caller.
        return Promise.reject(serverError);
    });
}
