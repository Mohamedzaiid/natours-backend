/* eslint-disable  */

import axios from 'axios';
import { showAlert } from './alerts';

// data is the object has the data for updating and type for "password or data"
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/update-password'
        : '/api/v1/users/update-me';
    const result = await axios({
      method: 'PATCH',
      url,
      data: data,
    });

    if (result.data.status === 'success') {
      // alert('Logged in successfully');
      showAlert('success', `${type.toUpperCase()} Updated Seccessfully!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 500);
    }
  } catch (err) {
    // console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};
