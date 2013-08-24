//= require jquery

(function () {
  var $form = $('form');
  var $submit = $('form input[type="submit"]');
  var $name = $('#name');
  var $email = $('#email');
  var $phoneNumber = $('#phone-number');

  // store use info locally whenever they successfully submit the form
  if (window.localStorage) {
    // the key prefix we store the information under
    var keyPrefix = 'sign-up-info-';

    // store the info in localStorage when the form is submitted
    $form.on('submit', function () {
      var name = $name.val();
      var email = $email.val();
      var phoneNumber = $phoneNumber.val();

      window.localStorage.setItem(keyPrefix + 'name', name);
      window.localStorage.setItem(keyPrefix + 'email', email);
      window.localStorage.setItem(keyPrefix + 'phone-number', phoneNumber);
    });

    // load the info from localstorage into the form if it exists
    var name = window.localStorage.getItem(keyPrefix + 'name');
    var email = window.localStorage.getItem(keyPrefix + 'email');
    var phoneNumber = window.localStorage.getItem(keyPrefix + 'phone-number');

    $name.val(name);
    $email.val(email);
    $phoneNumber.val(phoneNumber);
  }

  // mark the form as 'loading' when the submit button is clicked
  $submit.on('click', function (e) { $form.addClass('loading'); });
}());