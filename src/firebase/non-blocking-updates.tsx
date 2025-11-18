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
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { errorEmitter } from './error-emitter';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  return setDoc(docRef, data, options || {}).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: operation,
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    return Promise.reject(permissionError);
  });
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise so the caller can chain .then() or .catch().
 */
export function addDocumentNonBlocking(colRef: CollectionReference<DocumentData>, data: any): Promise<DocumentReference<DocumentData>> {
  return addDoc(colRef, data).catch(serverError => {
    const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    return Promise.reject(permissionError);
  });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  return updateDoc(docRef, data)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      return Promise.reject(permissionError);
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  return deleteDoc(docRef)
    .catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
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
        // First, check if the server error is ALREADY our specific error.
        // This can happen if a get() inside the transaction fails with a permission error
        // that we've already wrapped.
        if (serverError instanceof FirestorePermissionError) {
            errorEmitter.emit('permission-error', serverError);
            return Promise.reject(serverError);
        }

        // If it's a generic error, wrap it with our context.
        const permissionError = new FirestorePermissionError(errorContext);
        errorEmitter.emit('permission-error', permissionError);
        return Promise.reject(permissionError);
    });
}
