/* eslint-disable  */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (result.data.status === 'success') {
      // alert('Logged in successfully');
      showAlert('success', 'Logged in seccessfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    if (result.data.status === 'success') {
      showAlert('success', 'Logged out seccessfully!');
      location.assign('/');
    }
  } catch (err) {
    showAlert('error', 'Error Logging out! Try again.');
  }
};
