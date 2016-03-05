(function($) {
  'use strict';

  if (!$.fn.popover) throw new Error('confirmPopover requires popover.js');

  $.fn.confirmPopover = function(options) {
    function generateId() {
      return (Math.random() + '').slice(2, 11);
    }

        // Create the container for all the popovers if not exists.
    let $mainContainer = $('#popovers-container');

    if ($mainContainer.length === 0) {
      if (typeof options.$rootContainer === 'undefined') {
        options.$rootContainer = $('body');
      }
      options.$rootContainer.append('<div id="popovers-container"></div>');
      $mainContainer = $('#popovers-container');
    }

    this.each(function(index, item) {
      const containerId = generateId();
      const $item = $(item);
      let itemId = $item.attr('id');
      let $container;

      // If the item used to trigger the popover does not have an id, let's
      // generate a new one for it.
      if (typeof itemId === 'undefined') {
        itemId = generateId();
        $item.attr('id', itemId);
      }

      // Create a container with a known id for the actual popover so we can
      // access the popover content (and bind the buttons to a callback).
      $mainContainer.append('<div id="' + containerId + '"></div>');

      // Store the id of the item that triggers the popover in the container
      // so we can toggle the popover state.
      $container = $('#' + containerId);
      $container.data('source-element', itemId);

      $item.data('title', options.title);
      $item.data('content', options.content);
      $item.data('toggle', 'popover');
      $item.data('html', true);
      $item.data('placement', 'top');
      $item.data('template', $(options.template).html());
      $item.data('container', '#' + containerId);
      $item.data('first-time', true);
      $item.popover();

      $item.on('show.bs.popover', function() {
        $mainContainer.find('.popover').map(function(index, item) {
          // Clicking on every popover already opened we implement
          // the 'singleton' functionality.
          const btnId = $(item).parent().data('source-element');
          $('#' + btnId).click();
        });
      });

      $item.on('shown.bs.popover', function() {
        if ($item.data('first-time')) {
          // Attach the buttons event handlers to the new popover.
          $item.data('first-time', false);
          $container.find('.btn-confirm').on('click', function() {
            options.onConfirm();
            $item.click();
          });
          $container.find('.btn-cancel').on('click', function() {
            $item.click();
          });
        }
      });
    });

    return this;
  };
}(jQuery));