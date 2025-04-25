/* eslint-disable  */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (result.data.status === 'success') {
      // alert('Logged in successfully');
      showAlert('success', 'Logged in sucessfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const result = await axios({
      method: 'GET',
      url: 'api/v1/users/logout',
    });

    if (result.data.status === 'success') {
      showAlert('success', 'Logged out sucessfully!');
      location.assign('/');
    }
  } catch (err) {
    showAlert('error', 'Error Logging out! Try again.');
  }
};
