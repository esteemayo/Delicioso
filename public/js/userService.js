import axios from 'axios';
import { showAlert } from './alert';

const USER_ENDPOINTS = 'http://localhost:9999/api/v1/users';

export const register = async data => {
    try {
        const res = await axios({
            method: 'POST',
            url: `${USER_ENDPOINTS}/register`,
            data
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Account created successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}