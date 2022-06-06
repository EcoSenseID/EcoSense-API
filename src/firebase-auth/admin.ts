import admin from 'firebase-admin';
import { firebaseInit } from '../helpers/secret-manager.js';

firebaseInit();

export default admin;