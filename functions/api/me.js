import { json } from './_auth.js';

export const onRequestGet = ({ data }) => json({ user: data.user });
