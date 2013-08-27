//= require jquery

(function () {
  var $form = $('#signup-form');
  var $submit = $form.find('input[type="submit"]');
  var $reset = $form.find('#form-reset-button');

  // all user-editable inputs
  var $inputs = $form.find('input:visible:not([type="submit"])');

  var loadingClass = 'loading';
  var storageKeyPrefix = 'sign-up-input-value:';
  var storageKeyRegexp = new RegExp(storageKeyPrefix + '#([a-zA-Z0-9_-]+)');

  // stop the loading spinners when the form is submitted, but invalid
  var handleInvalidForm = function (e) {
    $form.removeClass(loadingClass);
  };

  // show the loading animation until it's canceled or the form submits
  var handleSubmitClick = function () {
    $form.addClass(loadingClass);
  };

  // reset all inputs when the reset button is clicked
  var handleResetClick = function (e) {
    e.preventDefault();

    // kill the loading class, just for kicks
    $form.removeClass(loadingClass);

    $inputs.val('');
  };

  // get the name of a key to store input information under
  var buildStorageKey = function (id) {
    return storageKeyPrefix + '#' + id;
  };

  // store all input values to localStorage if possible
  var storeInputValues = function () {
    if (window.localStorage) {
      // store each value by its input's id
      $inputs.each(function () {
        var $input = $(this);
        var id = $input.attr('id');
        var value = $input.val();

        window.localStorage.setItem(buildStorageKey(id), value);
      });
    }
  };

  // load all input values from localStorage if possible
  var loadInputValues = function () {
    if (window.localStorage) {
      // store each value by its input's id
      $inputs.each(function () {
        var $input = $(this);
        var id = $input.attr('id');

        // load the value and give it to the input
        var value = window.localStorage.getItem(buildStorageKey(id));
        if (value) { $input.val(value); }
      });
    }
  };

  // store the info in localStorage when the form is submitted
  $form.on('submit', storeInputValues);
  loadInputValues();

  $reset.on('click', handleResetClick);
  $submit.on('click', handleSubmitClick);
  $inputs.on('invalid', handleInvalidForm);

  // focus the first visible input
  $inputs.first().trigger('focus');
}());
