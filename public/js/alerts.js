/* eslint-disable  */

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

//type is success or error
export const showAlert = (type, message, time = 7) => {
    hideAlert();
    const newDiv = document.createElement("div");

    // 2. Set the class and content using innerHTML
    newDiv.className = `alert alert--${type}`;
    newDiv.innerHTML = message;
    // const markup = `<div class= "alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentElement('afterbegin', newDiv);
    window.setTimeout(hideAlert, time * 1000);
};