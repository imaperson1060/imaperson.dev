/*!
  * Bootstrap Dialog v0.0.1 (https://iqbalfn.github.io/bootstrap-dialog/)
  * Copyright 2019 Iqbal Fauzi
  * Licensed under MIT (https://github.com/iqbalfn/bootstrap-dialog/blob/master/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('jquery')) :
  typeof define === 'function' && define.amd ? define(['exports', 'jquery'], factory) :
  (global = global || self, factory(global['bootstrap-dialog'] = {}, global.jQuery));
}(this, function (exports, $) { 'use strict';

  $ = $ && $.hasOwnProperty('default') ? $['default'] : $;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var NAME = 'dialog';
  var VERSION = '0.0.1';
  var Default = {
    button: {
      type: 'light',
      label: 'Cancel',
      dismiss: false,
      focus: false
    }
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

  };

  var Dialog =
  /*#__PURE__*/
  function () {
    function Dialog(options) {
      this._confirmed = false;
      this._options = options;

      this._makeModal();

      this._showModal();
    } // Getters


    var _proto = Dialog.prototype;

    // Private
    _proto._btnOptions = function _btnOptions(btn) {
      var btns = Default.button;

      for (var k in btns) {
        if (typeof btn[k] === 'undefined') btn[k] = btns[k];
      }

      return btn;
    };

    _proto._getInputValue = function _getInputValue() {
      if (!this._options.input) return;
      return $(this._input).val();
    };

    _proto._makeInput = function _makeInput() {
      var tmpl = '';
      var input = this._options.input;

      switch (input.type) {
        case 'textarea':
          tmpl = "<textarea class=\"form-control bs-dialog-input\" id=\"bs-dialog-input\" rows=\"3\" placeholder=\"" + input.label + "\"></textarea>";
          break;

        case 'select':
          var opts = '';

          for (var k in input) {
            opts += "<option value=\"" + k + "\">" + input[k] + "</option>";
          }

          tmpl = "<select class=\"custom-select my-1 mr-sm-2\" id=\"bs-dialog-input\">" + opts + "</select>";
          break;

        default:
          tmpl = "<input type=\"" + input.type + "\" class=\"form-control bs-dialog-input\" id=\"bs-dialog-input\" placeholder=\"" + input.label + "\">";
      }

      var tx = "\n            <div class=\"form-group\">\n                <label for=\"bs-dialog-input\">" + input.label + "</label>\n            </div>";
      this._input = $(tmpl).get(0);
      return $(tx).append(this._input);
    };

    _proto._makeModal = function _makeModal() {
      var _this = this;

      // headers
      var header = '';

      if (this._options.title) {
        header = "\n                <div class=\"modal-header\">\n                    <h5 class=\"modal-title\">" + this._options.title + "</h5>\n                    <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"Close\">                    </button>\n                </div>";
      } // message


      var message = '';
      if (this._options.message) message = "<p>" + this._options.message + "</p>"; // footer buttons

      var buttons = '';

      this._options.buttons.forEach(function (btn) {
        btn = _this._btnOptions(btn);
        var action = btn.dismiss ? ' data-bs-dismiss="modal"' : ' data-confirm="true"';
        var focus = btn.focus ? ' btn-focus-first' : '';
        buttons += "<button type=\"button\" class=\"btn btn-" + btn.type + focus + "\"" + action + ">" + btn.label + "</button>";
      });

      var tmpl = "\n            <div class=\"modal fade\" tabindex=\"-1\" role=\"dialog\">\n                <div class=\"modal-dialog\" role=\"document\">\n                    <div class=\"modal-content\">\n                        " + header + "\n                        <div class=\"modal-body\">\n                            " + message + "\n                        </div>\n                        <div class=\"modal-footer\">\n                            " + buttons + "\n                        </div>\n                    </div>\n                </div>\n            </div>";
      this._modal = $(tmpl).appendTo(document.body);

      if (this._options.input) {
        var form = this._makeInput();

        $(this._modal).find('.modal-body').append(form);
      }

      $(this._modal).on('click', '[data-confirm]', function (event) {
        _this._confirmed = true;
        $(_this._modal).modal('hide');
      });
      $(this._modal).on('hidden.bs.modal', function (event) {
        setTimeout(function (e) {
          return $(_this._modal).remove();
        }, 1000);
        if (!_this._options.callback) return;
        var arg = _this._confirmed;
        if (_this._confirmed && _this._options.input) arg = _this._getInputValue();

        _this._options.callback.call(_this, arg);
      });
      $(this._modal).on('shown.bs.modal', function (event) {
        if (_this._input) $(_this._input).focus();else $(_this._modal).find('.btn-focus-first').focus();
      });
    };

    _proto._showModal = function _showModal() {
      $(this._modal).modal('show');
    } // Static
    ;

    Dialog.alert = function alert(title, message, callback) {
      new Dialog({
        title: title,
        message: message,
        callback: callback,
        input: null,
        buttons: [{
          type: 'primary',
          focus: true,
          label: 'Ok'
        }]
      });
    };

    Dialog.confirm = function confirm(title, message, callback) {
      new Dialog({
        title: title,
        message: message,
        callback: callback,
        input: null,
        buttons: [{
          type: 'secondary',
          label: 'Cancel',
          dismiss: true
        }, {
          type: 'primary',
          focus: true,
          label: 'Ok'
        }]
      });
    };

    Dialog.prompt = function prompt(title, message, input, callback) {
      new Dialog({
        title: title,
        message: message,
        callback: callback,
        input: input,
        buttons: [{
          type: 'secondary',
          label: 'Cancel',
          dismiss: true
        }, {
          type: 'primary',
          focus: true,
          label: 'Ok'
        }]
      });
    };

    _createClass(Dialog, null, [{
      key: "VERSION",
      get: function get() {
        return VERSION;
      }
    }, {
      key: "Default",
      get: function get() {
        return Default;
      }
    }]);

    return Dialog;
  }();
  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   */


  $[NAME] = Dialog;

  exports.Dialog = Dialog;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=bootstrap-dialog.js.map
