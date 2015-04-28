var Settings = (function(window, $) {
    /// Private variables and functions
    var $form;
    var $formControls;
    var options;

    var removeInput = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parents('.form-group:first').remove();
    };

    var addInput = function(event) {
        event.preventDefault();
        var $newEntry = $(this).parents('.form-group:first').clone().appendTo($formControls);
        var $newInput = $newEntry.find('input');
        $newInput.val('');

        if (options.colorpicker) {
            $newEntry.find('.colorpicker-field').val(options.defaultColor);
            setColorpicker($newEntry.find('.input-group'));
            $newEntry.find('.form-control').css('color', options.defaultColor);
        }
        $newEntry.find('.btn-add').removeClass('btn-add').addClass('btn-remove').html(
            '<i class="glyphicon glyphicon-minus"></i>'
        ).on('click', removeInput);
    };

    var enableModifications = function(event) {
        event.preventDefault();
        event.stopPropagation();

        $formControls.find('input,button').each(function() {
            $(this).removeAttr('disabled');
        });
        if (options.colorpicker) {
            $formControls.find('.colorpicker-selector').removeClass('disabled');
        }
        var $btn = $form.find('button.btn-primary');
        $btn.text($btn.data('save-text'));
    };

    var setColorpicker = function(element) {
        element.colorpicker({
            input: '.colorpicker-field',
            template: '<div class="colorpicker dropdown-menu">' +
                '<div class="colorpicker-saturation"><i><b></b></i></div>' +
                '<div class="colorpicker-hue"><i></i></div>' +
                '<div class="colorpicker-alpha"><i></i></div>' +
                '</div>'
        });
        element.colorpicker().on('changeColor.colorpicker', function(event) {
            element.find('.form-control').css('color', event.color.toHex());
            return true;
        });
    };

    var init = function(_options) {
        $form = $('#form');
        $form.find('button.btn-primary').one('click', enableModifications);
        $formControls = $('#form-controls');
        $formControls.find('.btn-remove').on('click', removeInput);
        $formControls.find('.btn-add').on('click', addInput);
        options = _options;

        if (options.enabled) {
            $form.find('button.btn-primary').click();
        }
        if (options.colorpicker) {
            $formControls.find('.input-group').each(function() {
                var $this = $(this);
                setColorpicker($this);
                $this.find('.form-control').css(
                    'color', $this.colorpicker().data('colorpicker').color.toHex());
                if (!options.enabled) {
                    $this.colorpicker('disable');
                }
            });
        }
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);
