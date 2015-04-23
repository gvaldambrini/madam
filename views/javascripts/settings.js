var Settings = (function(window, $) {
    /// Private variables and functions
    var $form;
    var $formControls;

    var removeInput = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parents('.form-group:first').remove();
        checkDirties();
    };

    var addInput = function(event) {
        event.preventDefault();
        var $newEntry = $(this).parents('.form-group:first').clone().appendTo($formControls);
        var $newInput = $newEntry.find('input');
        $newInput.val('');
        $newInput.data('original-value', '');
        $newInput.removeClass('dirty');
        $newInput.on('keyup', checkIfDirty);
        $newEntry.find('.btn-add').removeClass('btn-add').addClass('btn-remove').html(
            '<i class="glyphicon glyphicon-minus"></i>'
        ).on('click', removeInput);
    };

    var checkDirties = function() {
        // Loop over all the input fields to verify if someone is dirty or the original
        // number of inputs is different from the current one.
        // As result of the check, it sets the submit button disabled or active.

        function filterDirty(e) {
            return $(this).hasClass('dirty');
        }
        var $inputs = $formControls.find('input');

        if ($inputs.filter(filterDirty).length == 0 &&
            $inputs.length == $formControls.data('original-length')) {
            $form.find('.btn-primary').attr('disabled', 'disabled');
        }
        else {
            $form.find('.btn-primary').removeAttr('disabled');
        }
    };

    var checkIfDirty = function(event) {
        // Check if an input field is dirty (is modified)
        var dirty = $(this).val() != $(this).data('original-value');
        if (dirty) {
            $(this).addClass('dirty');
            // there is no need to check every field, we can just enable
            // the submit button.
            $form.find('.btn-primary').removeAttr('disabled');
        }
        else {
            $(this).removeClass('dirty');
            checkDirties();
        }
    };

    var init = function() {
        // Set the initial state on the input elements to detect if any of them
        // has been modified.
        $form = $('#form');
        $formControls = $('#form-controls');

        var $inputs = $formControls.find('input');
        $formControls.data('original-length', $inputs.length);

        $inputs.on('keyup', checkIfDirty);
        $formControls.find('.btn-remove').on('click', removeInput);
        $formControls.find('.btn-add').on('click', addInput);
    };

    /// Public API
    return {
        init: init
    };
})(window, jQuery);