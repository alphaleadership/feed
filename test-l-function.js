import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.receiving.list();
console.log("Liste des emails reçus:", data);