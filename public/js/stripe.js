/* eslint-disable  */

import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';


export const bookTour = async (tourId) => {
  const stripe = await loadStripe(
    'pk_test_51NQuhSCx5TAWu5CauTBY8i1gdtnZvb5MkTVDOoruHOJaoC4lFaDKulBysfpeML7OCbb9oss6gwIPjwDs4Pujh6lK00WzZY55Q7',
  );
  //1) get checkout session form api
  try {
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    // console.log(session);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
