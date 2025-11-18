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
 * Initiates a Firestore transaction, handling permission errors gracefully.
 * This wrapper ensures that if the transaction fails due to security rules,
 * a detailed FirestorePermissionError is created and emitted globally.
 */
export function runVoteTransaction(
    db: Firestore, 
    updateFunction: (transaction: Transaction) => Promise<any>,
    errorContext: SecurityRuleContext
): Promise<any> {
    return runTransaction(db, updateFunction).catch(serverError => {
        // Assume any error from the transaction is a permission error.
        // Create the rich, contextual error.
        const permissionError = new FirestorePermissionError(errorContext);
        
        // Emit the error globally for the listener to catch and display.
        errorEmitter.emit('permission-error', permissionError);
        
        // Reject the promise to allow the calling component to handle UI state reversal.
        return Promise.reject(permissionError);
    });
}
