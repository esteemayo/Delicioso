import axios from 'axios';
import { showAlert } from './alert';

const UPDATE_ENDPOINTS = 'http://localhost:9999/api/v1/users';

export const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' ?
            `${UPDATE_ENDPOINTS}/updateMyPassword` :
            `${UPDATE_ENDPOINTS}/updateMe`;

        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
            window.setTimeout(() => {
                location.assign('/account');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}