import * as admin from 'firebase-admin';
import { firebaseInit } from '../helpers/secret-manager';

firebaseInit();

export default admin;