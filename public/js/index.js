import '@babel/polyfill';
import { $, $$ } from './bling';
import { login, logout, forgot } from './authService';
import { register } from './userService';
import { updateSettings } from './updateService';
import ajaxHeart from './heart';
import autoComplete from './autocomplete';
import makeMap from './map';
import typeAhead from './typeAhead';

// DOM element
const loginForm = $('.form--login');
const logoutBtn = $('.logout--btn');
const registerForm = $('.form--register');
const forgotPasswordForm = $('.form--forgot-password');
const updateUserData = $('.form-user-data');
const updateUserPassword = $('.form-user-password');
const heartsForms = $$('form.heart');

// Delegation
if (loginForm)
    loginForm.on('submit', e => {
        e.preventDefault();

        const email = $('#email').value;
        const password = $('#password').value;

        login(email, password);
    });

if (logoutBtn) logoutBtn.on('click', logout);

if (forgotPasswordForm)
    forgotPasswordForm.on('submit', e => {
        e.preventDefault();

        const email = $('#email').value;

        forgot(email);
    });

if (registerForm)
    registerForm.on('submit', e => {
        e.preventDefault();

        const form = new FormData();

        form.append('name', $('#name').value);
        form.append('email', $('#email').value);
        form.append('password', $('#password').value);
        form.append('passwordConfirm', $('#passwordConfirm').value);
        form.append('photo', $('#photo').files[0]);
        
        register(form)
    });

if (updateUserData)
    updateUserData.on('submit', e => {
        e.preventDefault();

        const form = new FormData();

        form.append('name', $('#name').value);
        form.append('email', $('#email').value);
        form.append('photo', $('#photo').files[0]);
        
        updateSettings(form, 'data');
    });

if (updateUserPassword)
    updateUserPassword.on('submit', e => {
        e.preventDefault();

        $('.btn--save-password').textContent = 'Updating...';

        const passwordCurrent = $('#passwordCurrent').value;
        const password = $('#password').value;
        const passwordConfirm = $('#passwordConfirm').value;

        $('#passwordCurrent').value = '';
        $('#password').value = '';
        $('#passwordConfirm').value = '';

        $('.btn--save-password').textContent = 'Update My Password →';

        updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    });

if (heartsForms)
    heartsForms.on('submit', ajaxHeart);

autoComplete( $('#address'), $('#lat'), $('lng') );

makeMap( $('#map') );

typeAhead( $('.search') );