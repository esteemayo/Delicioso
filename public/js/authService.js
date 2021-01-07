import axios from 'axios';
import { showAlert } from './alert';

const AUTH_ENDPOINTS = 'http://localhost:9999/api/v1/users';

export const login = async (email, password) => {
    try {
        const { data } = await axios({
            method: 'POST',
            url: `${AUTH_ENDPOINTS}/login`,
            data: {
                email,
                password
            }
        });

        if (data.status === 'success') {
            showAlert('success', 'Successfully logged in!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}

export const logout = async () => {
    try {
        const { data } = await axios({
            method: 'GET',
            url: `${AUTH_ENDPOINTS}/logout`
        });
        
        if (data.status === 'success') {
            showAlert('success', 'Logged you out!');
            window.setTimeout(() => {
                location.assign('/');
            });
        }
    } catch (err) {
        showAlert('error', 'Error logging out! Try again.');
    }
}

export const forgot = async email => {
    try {
        const { data } = await axios({
            method: 'POST',
            url: `${AUTH_ENDPOINTS}/forgotPassword`,
            data: {
                email
            }
        });

        if (data.status === 'success') {
            showAlert('success', data.message);
            window.setTimeout(() => {
                location.assign('/forgot');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}