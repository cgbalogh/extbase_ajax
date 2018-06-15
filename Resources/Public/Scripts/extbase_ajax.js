// check for jQuery
// var reqPlugins = ['dialog','button','fadeOut'];
var extbaseajaxAttributes = [
    'beforeshow',
    'extbaseajax',
    'onclick',
    'onresponse',
    'onshow',
    'onsave',
    'canceltext',
    'savetext',
    'cancel',
    'confirm',
    'text',
    'plugin',
    'remove',
    'onconfirm',
    'beforesave',
    'readonly',
    'href',
    'newwindow',
    'newtab',
    'wwidth',
    'wheight',
    'wscrollbars',
    'target',
    'title',
    'params',
    'changealert',
    'uri',
    'icon',
    'ui-disabled',
    'lang'];
var error = '';
var files;
var modalWindowStack = [];
var uidlist = null;
var test = null;

$(document).ready(function() {
	autoAjax();
});

/**
 * makeFn
 * rev 2017-02-21
 * 
 * takes text and wraps in a "function(){}" 
 * returns function if valid eval possible, null otherwise
 */
function makeFn (text) {
    // if undefined return null
	if (typeof(text) == 'undefined') {
        return null;
    }
	
	// try to eval the text to function
    var fnText = 'var fnFun = function() {' + text + '}';
    
	try {
		eval(fnText);
		return fnFun;
	}
	catch (e) {
		alert('Error #1487712226: Cannot evaluate expression \r\n' + text + '\r\n to Javascript function.\r\n ' + error);
	}
	return null;
}

/**
 * autoAjax
 * rev 2017-02-21
 * 
 * This function initializes th eajax functionality for links and forms. It will add some classes to the 
 * prepared tags. The calls are defined through additional paramters as attributes in the respective tag.
 */
function autoAjax() {
	// We started allowing buttons also for <img> tags. This wont work in IE, since it complains, that <img> tags are not allowed
	// to have child nodes, but jQuery.button() is intended for <span> tags only and adds a span tag as child node
	// to img tag. Funny enough, this works perfectly in FF. This means that we have to move the parameters to a span tag
	// which wraps the img tag
	$('img.modalDialog, img.modalMultiform, img.modalMessage, img.modalConfirm, img.autoRedirect, img.ajaxRequest').each(function () {
		var addClassname = '';
		if ($(this).hasClass('modalDialog')) addClassname = 'modalDialog';
		if ($(this).hasClass('modalMessage')) addClassname = 'modalMessage';
		if ($(this).hasClass('modalConfirm')) addClassname = 'modalConfirm';
		if ($(this).hasClass('autoRedirect')) addClassname = 'autoRedirect';
		if ($(this).hasClass('ajaxRequest')) addClassname = 'ajaxRequest';
		
        // put a SPAN wrap around the IMG tag and shift the class
		$(this).wrap('<span class="' + addClassname +  ' ui-img-button" />' );
		$(this).removeClass('modalDialog modalMultiform modalMessage modalConfirm autoRedirect ajaxRequest');
	  
		// now shift all the reserved attributes from IMG tag to SPAN tag.
        // required/allowed attributes are listed in extbaseajaxAttributes (see top of script)
		for (attributeKey in extbaseajaxAttributes) {
			attributeName = extbaseajaxAttributes[attributeKey];
			if ($(this).attr(attributeName)) {
				$(this).closest('span').attr(attributeName, $(this).attr(attributeName));
				$(this).removeAttr(attributeName);
			}
		}
	});
	// done with wrapping a SPAN-tag around the IMG and moving all the required attributes and classes
	
    /**
     * invoke ajax requests
     * 
     * now for each of the classes modalDialog, modal Multiform, modalMessage, modalConfirm, autoRedirect and ajaxRequest
     * a corresponding function will be called to execute the required task. This is done via the click() function
     * in jquery. 
     */
    
	// activate modal dialog boxes
	$( '.modalDialog' ).each(function(){
        $(this).button({disabled: ($(this).attr('ui-disabled')==1)}).unbind('click').click(function(event) {
            event.stopPropagation();
            modalDialogWindow($(this), $(this).attr('title'), $(this).attr('text'),  $(this).attr('params'), event);
        });
        
        // this is necessary to avoid reloading the modal dialog buttons if forms are nested!
        $(this).removeClass('modalDialog');
    });
        
	// invoke modal mmessages
	$( '.modalMessage' ).each(function(){
        $(this).button({disabled: ($(this).attr('ui-disabled')==1)}).unbind('click').click(function(event) {
            event.stopPropagation();
            modalMessageWindow($(this), $(this).attr('title'), $(this).attr('text'),  $(this).attr('params'), event);
        });
        
        // this is necessary to avoid reloading the modal dialog buttons if forms are nested!
        $(this).removeClass('modalDialog');
    });

	// activate modal confirm dialog box
	$('.modalConfirm' ).button().unbind('click').click(function(event) {
        event.stopPropagation();
        modalConfirmWindow($(this), $(this).attr('title'), $(this).attr('text'));
	});

    
    
	$('.ajaxRequest' ).button().unbind('click').click(function(event) {
		event.stopPropagation();

		var onclick = makeFn($(this).attr('onclick'));
		var onresponse = makeFn($(this).attr('onresponse'));
		var postVars = $(this).closest('form').serialize();

        if ($(this).attr('sendformdata') == 'no') postVars = '';

		if (typeof ($(this).attr('extbaseajax')) != 'undefined') {
            // try {if (typeof(onclick) == 'function') onclick();}
            // catch (error) {alert('Error #11486548: onclick failed' + error);}            
            
			var url = autoCreateUrl($(this).attr('extbaseajax'), 0, $(this).attr('plugin'));
			if (url) {
				$.get(url, postVars, function(data) { 


                    /* new BEGIN */
                    try { pushData(data); }
                    catch (e) {}

                    try { d = $.parseJSON(data); } catch(e) { 
                        modalMessage ('', data, 'Ok');
                    }
                    success = data.sucess;
                    message = data.message;
                    try {if (typeof(onconfirm) == 'function') onconfirm()} catch (e) {}		
                    jqueryInterface(data);
                    /* new END */
                    
//					try { d = $.parseJSON(data); } catch (e) {
						
//					};
					
					try {if (typeof(onresponse) == 'function') onresponse();}
					catch (error) {alert('Error #76399: onresponse failed' + error);}
				});
			} else {
			}
		}
		autoAjax();
	});

	// invoke autoredirects
	$('.autoRedirect' ).button().unbind('click').click(function(event) {
        event.stopPropagation();
		if ($(this).attr('disable') == '1') return;
		
		if ($(this).attr('href')) {
			url = $(this).attr('href')
		} else {
			var url = autoCreateUrl($(this).attr('extbaseajax'), $(document).getUrlParam('id'), $(this).attr('plugin'));
		}
		if (typeof($(this).attr('newwindow')) != 'undefined') {
			url += '&mode=standalone'
			title = $(this).attr('title');
			wwidth = $(this).attr('wwidth');if (typeof(wwidth) == 'undefined') wwidth=600;
			wheight = $(this).attr('wheight');if (typeof(wheight) == 'undefined') wheight=300;
			wscrollbars = $(this).attr('wscrollbars');
			window.open(url, title, 'width='+wwidth+',height='+wheight+',scrollbars='+wscrollbars);
		} else if (typeof($(this).attr('newtab')) != 'undefined') {
			if (typeof($(this).attr('target')) != 'undefined') {
				window.open(url, $(this).attr('target'));
			} else {
				window.open(url);
			}
		} else {
			window.location = url;
		}
	});
}

/**
 * autoCreateUrl
 * rev 2017-02-21
 * 
 * Creates an URL from the ajax settings including the attributes as parameters
 * Prepares a callback url to backend
 * 
 * @param {type} paramList
 * @param {type} idFromUri
 * @param {type} plugin
 * @param {type} actionName
 * @returns {String}
 */
function autoCreateUrl ( paramList, idFromUri, plugin, actionName ) {
	var pagetype = '?type=' + extbaseAjax.type;
	var url = '';
	var pageid = '';
	if (idFromUri) {
		pageid = '&id=' + idFromUri.toString();
	}

	if (! plugin) {
		plugin = extbaseAjax.prefix;
	}

    try {
		var attributes = eval('({' + paramList + '})');

		if (actionName) {
			attributes['action'] = actionName;
		}

		if (typeof(attributes.plugin) != 'undefined') plugin = attributes.plugin;
		for (key in attributes) {
			if (key == 'type') {
				pagetype = '?type=' + attributes[key];
			} else if (key == 'id') {
				pageid = '&id=' + attributes[key];
            } else if (attributes[key] == 'uidlist') {
                url += '&' + plugin + '[' + key + ']=' + uidlist;
			} else {
				if (Right(key, 1) == '_') {
					keyList = key.split('_');
					newKey = '';
					for (n = 0; n < keyList.length - 1; n++) {
						newKey += '[' + keyList[n] + ']';
					}
					url += '&' + plugin + newKey + '=' + attributes[key];
				} else {
					url += '&' + plugin + '[' + key + ']=' + attributes[key];
				}
			}
		}
		return pagetype + pageid + url;
	}
	catch (error) {
		alert('Error #1487713466: Invalid extbaseajax attribute. Cannot evaluate ' + paramList);
		return '';
	}
}

/**
 * dialogSave
 * rev 2017-02-21
 * 
 * @param {type} $el
 * @param {type} onsave
 * @param {type} onshow
 * @param {type} beforesave
 * @returns {undefined}
 * 
 * dependencies: pushData(), jqueryInterface()
 */
function dialogSave($el, onsave, onshow, beforesave) {
	// unbind events
    if (typeof($el) != 'undefined') {
        // $('#' + $el.attr('id') ).find('*').unbind();
    }

    // find form
    var $form = $el.find('form');
    
    // try to execute beforesave
	try {
        if (typeof(beforesave) == 'function') {
            beforesave();
        }
    } 
    catch (e) {
    }
    
    // serialize post vars and get action from form
	var postVars = $form.serialize();
	var url = $form.attr('action');

	// set type if given otherwise take default from extbaseAjax array
    if (typeof($form.attr('type')) != 'undefined') {
		url += '&type=' + $form.attr('type');
	} else {
		url += '&type=' + extbaseAjax.type;
	}

    if ($form.attr('data-ajax-uri')) {
        url = $form.attr('data-ajax-uri');
    }

    // initialize laoded with false 
	var loaded = false;
    
    // send form using post via ajax
	// $.post(url, postVars, function(data) {
    $.ajax({
      type: 'POST',
      url: url,
      data: postVars,
      error: function(jqXHR, textStatus, errorThrown){
        document.write(jqXHR.responseText);
      },
      success: function(data){
		try {
			var result = pushData(data);
			if (result === false ) {
				loaded = false;
			} else {
				d = $.parseJSON(data);
				$el.find('form').attr('changed', 'false');			
				$el.find('*').unbind();
				$el.dialog('destroy');	
				$el.detach();
				loaded = true;
                jqueryInterface(data);                
			}
            $('body').removeClass('modal-open');
		}
		catch (error) {
            // revive the dialog because an error occured
			$el.html(data);
            
            $('#' + $el.attr('id') ).find('*').unbind();
            modalWindowStack.unshift($el);
			// $el.find('form').attr('changed', 'true');
            autoAjax();	
			
			try {if (typeof(onshow) == 'function') 
				onshow();
				// $('#' + elementid).detach();
			} catch(e) {}
            
            // execute embedded JS 
            $('script.extbase_ajax_script').each(function(){s = $(this).text().replace('<![CDATA[','').replace(']]>','');eval(s);});
            
		}
		
        // if the result was loaded successfully and there is a onshow function execute now
		if (loaded) {
			try {
                if (typeof(onsave) == 'function') {
                    onsave()
                }
            } 
            catch (e) {}
		}
	}});
	
	// .error(function(data) {
    //		alert('Error #1487714151: ' + data.status + ' ' + data.statusText);
	// });
}


/**
 * randomString
 * Returns a rando string of length <lenght>
 * Only lower case characters and numbers will be used
 * 
 * @param length
 */
function randomString(length) {
    var chars = '0123456789abcdefghiklmnopqrstuvwxyz'.split('');
    if (! length) length = Math.floor(Math.random() * chars.length);
    
    var str = '';
    for (var i = 0; i < length; i++) {str += chars[Math.floor(Math.random() * chars.length)];}
    return str;
}

/**
 * activateWarning
 * activates the warning dialog if fields in modal form have changed
 */
function activateWarning ( $window ) {
	$form = $window.find('form');
	var changed = $form.attr('changed');
	if (typeof(changed) == 'undefined') {$form.attr('changed', 'false');}
	$form.find('input').change(function(){$form.attr('changed', 'true');});
}


/**
 * dialogAction
 */
function dialogAction ($dialog, $el, onconfirm) {
    if ($el.attr('uri')) {
        var url = $el.attr('uri');
    } else {
        if (typeof($el.attr('extbaseajax')) != 'undefined') {
            var url = autoCreateUrl($el.attr('extbaseajax'), 0, $el.attr('plugin'));
        }
        if (lang) {
            url += '&L=' + lang;
        }
    }
    
	var removeElement = $el.attr('remove');

	if (url) {
		$.ajax({
            url: url,
            async: false,
            success: function(data) {
                try { pushData(data); }
                catch (e) {
                    alert('Error #1487715092: Cannot interpret as JSON data: ' + data);
                }

                try { d = $.parseJSON(data); } catch(e) { 
                    modalMessageWindow ('', data, 'Ok');
                }
                success = data.sucess;
                message = data.message;
                try {
                    if (typeof(onconfirm) == 'function') {
                        onconfirm();
                    }
                } 
                catch (e) {}
                jqueryInterface(data);
            }
		});
	} else {
		try {if (typeof(onconfirm) == 'function') onconfirm()} catch (e) {}		
	}
    // ($dialog);
	dialogClose($dialog);
}


/**
 *
 */
function jqueryInterface(data) {
	try {
		resultArray = $.parseJSON(data);
		actions = resultArray.actions;
        
        $(actions.fadeOut).fadeOut();
        
		for (key in actions) {
			switch(actions[key].jQcmd) {
				case 'fadeOut':$(actions[key].jQsel).fadeOut();break;
				case 'html':$(actions[key].jQsel).html(actions[key].jQdata);break;
				case 'attr':$(actions[key].jQsel).attr(actions[key].jQprop, actions[key].jQdata);break;
				case 'css':$(actions[key].jQsel).css(actions[key].jQprop, actions[key].jQdata);break;
				case 'addClass':$(actions[key].jQsel).addClass(actions[key].jQdata);break;
				case 'removeClass':$(actions[key].jQsel).removeClass(actions[key].jQdata);break;
				case 'openUri': 
                    // window.open();
                    // location = actions[key].jQdata;
                    window.open(actions[key].jQdata, '_blank');
                    break;
				case 'execFN':
                    var execFN = makeFn(actions[key].jQdata);

                    try {if (typeof(execFN) == 'function') execFN();}
					catch (error) {alert('Error #1434874828: execFN failed!');}
                    break;
			}
		}
	}
	catch (e) {}
}

/**
 * pushData
 * 
 * reviewd 2017-02-15
 * 
 * takes an JSON array and pushes the data into span tags with 
 * reference in key
 */
function pushData(data) {
	resultArray = $.parseJSON(data);
	if (resultArray.success == 'ok' || resultArray.success == true) {
		if (typeof(resultArray.additemtype) != 'undefined') {
			$( '#' + resultArray.item + 'List' + resultArray.itemtype ).append( resultArray.showView );
		}

        // find all elements with the reference setting and change according to reply
		$.each(resultArray, function(key, value) {
			$('[reference="' + key + '"]').html(value);
		});
		
        // remove element with rowId
        $('#' + resultArray.remove).fadeOut();
		
		return resultArray.redirect;
	} else {
        // if not ok mark fields as error
		for (key in resultArray.error) {
			$(resultArray.error[key]).addClass('f3-form-error');
		}
		return false;
	}
}

/**
 * Right
 * 
 * @param {type} str
 * @param {type} n
 * @returns {String}
 */
function Right(str, n){
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else {
		var iLen = String(str).length;
		return String(str).substring(iLen, iLen - n);
	}
}

function makeButtons (currentform, buttondata, actiondata, nextformdata) {

	buttons = new Array();
				
	for (i = 0; i < buttondata[currentform-1].length; i++) {
		buttontext = buttondata[currentform-1][i];
		action = actiondata[currentform-1][i];
		nextform = nextformdata[currentform-1][i];

		buttons.push(
			{
				text: buttontext,
				name: action,
				value: nextform,
				click: function(e) { 
					// save Form Data to session or something else	

					url = autoCreateUrl($modalWindow.attr('extbaseajax'), 0, $modalWindow.attr('plugin'), e.target.name);
					$.get(url, '', function(data) {
						$modalWindow.html(data);
						// set buttons
						buttons = makeButtons(e.target.value, buttondata, actiondata, nextformdata);
						$modalWindow.dialog( "option", "buttons", buttons );
					});
				}
			}
		);
	}
	
	return buttons;
}


/**
 * function modalAskWindow
 * 
 * @param {string} text
 * @param {function} onYes
 * @param {funstion} onNo
 * @returns {undefined}
 */
function modalAskWindow ( text, onYes, onNo ) {
    // stop propagating events to other windows
    // event.stopPropagation();

    // create random id for modal window stack
    var elementid = randomString(16);

    // add div tag at the beginning of the document, will be used by modalForm
	$( 'body' ).prepend('<div id="modalWindow_' + elementid + '"></div>');
	
    // add new window element add top of stack
    modalWindowStack.unshift($( '#modalWindow_' + elementid ));

    // write text to window as content
    modalWindowStack[0].addClass('extbase_ajax_modal_ask');
    modalWindowStack[0].html(text);
    
    // invoke jQuery dialogue
    returnCode = modalWindowStack[0].dialog({
        modal: true, 
        resizable: false,
        title: extbaseAjax.confirmtitle,
        closeOnEscape: true,
        buttons: [
                {text: extbaseAjax.buttonyes, click: function() { 
                        $myWindow  = modalWindowStack.shift(); 
                        dialogDestroy($myWindow);
                        try {onYes();} catch (e) { }
                    }},
                {text: extbaseAjax.buttonno, click: function() { 
                        $myWindow  = modalWindowStack.shift(); 
                        dialogDestroy($myWindow);
                        try {onNo();} catch (e) { }
                    }}
            ],
        close: function(ev, ui){
                if ( $(this).attr('id') == modalWindowStack[0].attr('id') ) {
                    $myWindow  = modalWindowStack.shift(); 
                }
            },
        beforeClose: function(event, ui) {
            }
    });
}



/**
 * 
 * @param {object} $element
 * @param {string} title
 * @param {string} text
 * @returns {undefined}
 */
function modalConfirmWindow ( $element, title, text ) {
    // set text for no and yes button
    var cancelButtonText = $element.attr('cancel') ? $element.attr('cancel') : extbaseAjax.buttonno;
    var confirmButtonText = $element.attr('confirm') ? $element.attr('confirm') : extbaseAjax.buttonyes;

    // set function to be executed if dialog is confirmed
    var onconfirm = makeFn($element.attr('onconfirm'));

    // set function to be executed before dialog is showed
    var beforeshow = makeFn($element.attr('beforeshow'));
    uidlist = null;
    try {
        if (typeof(beforeshow) == 'function') {
            beforeshow();
        }
    }
    catch (error) 
    {
        alert('Error #1487716594: beforeshow failed in modalConfirmWindow' + error);
    }
    
    var icon = $element.attr('icon');

    // create random id for modal window stack
    var elementid = randomString(16);

    // add div tag at the beginning of the document, will be used by modalForm
	$( 'body' ).prepend('<div id="modalWindow_' + elementid + '"></div>');
	
    // add new window element add top off stack
    modalWindowStack.unshift($( '#modalWindow_' + elementid ));

    // write text to window as content
    modalWindowStack[0].addClass('extbase_ajax_modal_confirm');
    // TODO: why did I do this?
    // modalWindowStack[0].html('<a style="display: block; width: 1px; height: 1px; overflow: hidden; position: absolute;" href="#"> </a>' + text);
    modalWindowStack[0].html(text);
    
    // invoke jQuery dialogue
    returnCode = modalWindowStack[0].dialog({
        modal: true, 
        title: title,
        closeOnEscape: true,
        buttons: [
            {text: cancelButtonText, click: function() { 
                $myWindow  = modalWindowStack.shift(); 
                dialogClose($myWindow);
            }},
            {text: confirmButtonText, click: function() { 
                $myWindow  = modalWindowStack.shift(); 
                dialogAction($myWindow, $element, onconfirm);}}
            ],
        close: function(ev, ui){
            if ( modalWindowStack[0] && ($(this).attr('id') == modalWindowStack[0].attr('id')) ) {
                $myWindow  = modalWindowStack.shift(); 
            }
        },
        beforeClose: function(event, ui) {
        },
        create: function(event, ui) {
            if (typeof(icon) != 'undefined') {
                // htmlImgTag = '<img style="display: block; float: left; width: 28px; height: 28px; margin-right: 10px;" alt="" src="' + icon + '" />'; 
                $(this).prev('.ui-dialog-titlebar').prepend(icon);
            }
        }
        
    });
}

/**
 * 
 * @param {object} $element
 * @param {string} title
 * @param {string} text
 * @param {string} params
 * @param {object} event
 * @returns {undefined}
 */
function modalMessageWindow( $element, title, text, params, event ) {
    // event.stopPropagation();
    // set onshow and onsave function
    if ($element) {
        var onshow = makeFn($element.attr('onshow'));
        var onsave = makeFn($element.attr('onsave'));
    }
	
    addParams = '';
    if ( (typeof(params) != 'undefined') && (params != '')) {
        paramList = params.split(',');
        for (i = 0;i < paramList.length; i++) {
            paramId = paramList[i];
            paramValue = $('#' + paramId).val();
            addParams += ',' + paramId + ":'" +  paramValue + "'"
        }
    }

    lang = $(document).getUrlParam('L');
	
    if ($element.attr('uri')) {
        var url = $element.attr('uri');
    } else {
        var url = autoCreateUrl($element.attr('extbaseajax') + addParams, 0, $element.attr('plugin'));
        if (lang) {
            url += '&L=' + lang;
        }
    }

    // set text for ok button
    var okButtonText = $element.attr('oktext') ? $element.attr('oktext') : extbaseAjax.buttonok;
    var wwidth = $element.attr('wwidth') ? $element.attr('wwidth') : 'auto';

    if ($('html').width() < 720) {
        wwidth = '100%';
    }



    if (typeof(text) == 'undefined') {
        $.get(url, '', function(data) { 
            modalMessageInvoke(title, data, okButtonText, onshow, onsave, wwidth, $element.attr('height'));
        });
    } else {
        modalMessageInvoke(title, $element.attr('text'), okButtonText, onshow, onsave, wwidth, $element.attr('height'));
    }
    
    autoAjax();
}



function modalDialogWindow ( $element, title, text, params, event ) {
    // set text for no and yes button
    var savetext = $element.attr('savetext') ? $element.attr('savetext') : extbaseAjax.buttonsave;
    var canceltext = $element.attr('canceltext') ? $element.attr('canceltext') : extbaseAjax.buttoncancel;
    var readonly = $element.attr('readonly') ? $element.attr('readonly') : false;
    var wwidth = $element.attr('wwidth') ? $element.attr('wwidth') : 'auto';

    if ($('html').width() < 720) {
        wwidth = '100%';
    }
    
    var onsave = makeFn($element.attr('onsave'));
    var beforesave = makeFn($element.attr('beforesave'));
    var onshow = makeFn($element.attr('onshow'));
    var icon = $element.attr('icon');

    lang = $(document).getUrlParam('L');
	
    if ($element.attr('uri')) {
        var url = $element.attr('uri');
    } else {
        var url = autoCreateUrl($element.attr('extbaseajax'), 0, $element.attr('plugin'));
        if (lang) {
            url += '&L=' + lang;
        }
    }
    
    var elementid = randomString(16);
    var changealertOff = (typeof($element.attr('changealert')) != 'undefined' & $element.attr('changealert') == 'off') ? true : false;
    var readonly = typeof($element.attr('readonly')) != 'undefined';

    // add div tag at the beginning of the document, will be used by modalForm
    $( 'body' ).prepend('<div id="modalWindow_' + elementid + '" class="modalWindow"></div>');
    // $modalWindow = $( '#modalWindow_' + elementid );

    // add new window element add top off stack
    modalWindowStack.unshift($( '#modalWindow_' + elementid ));

    // write text to window as content
    
    data = $('#postdata').data('postvar') + '=' + $('#postdata').data('value');
    
    if (url) {
        //$.post(url, data, function(data) { 
        $.ajax({
          type: 'POST',
          url: url,
          data: data,
          error: function(jqXHR, textStatus, errorThrown){
              document.write(jqXHR.responseText);
          },
          success: function(data){
        
            modalWindowStack[0].addClass('extbase_ajax_modal_dialog');
            modalWindowStack[0].html(data);
				
            // userNosave = $('#storage').attr('readonly')
            // if (typeof(userNosave) != 'undefined') readonly = userNosave;

            if (readonly) {
                var buttons = [
                        {text: canceltext, click: function() {{dialogClose(modalWindowStack[0]);}}}
                    ];
            } else {
                var buttons = [
                        {text: savetext, click: function() {$myWindow  = modalWindowStack.shift(); dialogSave($myWindow, onsave, onshow, beforesave);}},
                        {text: canceltext, click: function() {$myWindow  = modalWindowStack.shift(); dialogClose($myWindow);}}
                    ];
            }

            // prepare modal form
            modalWindowStack[0].dialog({
                autoOpen: false});
                
            // prepare modal form
            modalWindowStack[0].dialog({
                autoOpen: false,
                autoResize: true,
                resizable: false,
                modal: true, 
                title: title,
                width: wwidth,
                show: 'fade',
                hide: 'fade',
                buttons: buttons,
                closeOnEscape: true,
                open: function() {
                    $('body').addClass('modal-open');

                    modalWindowStack[0].keypress(function(e) {
                      if ((e.keyCode == $.ui.keyCode.ENTER) & (e.shiftKey)) {
                        $(this).parent().find('.ui-dialog-buttonpane button:first').click();
                        return false;
                      }
                      if (e.keyCode == $.ui.keyCode.ESC) {
                        alert('esc')
                      }
                  });
                },
                close: function() {
                    // alert('dialog close');
                    if ( modalWindowStack[0] && ($(this).attr('id') == modalWindowStack[0].attr('id')) ) {
                        $myWindow  = modalWindowStack.shift(); 
                        if (modalWindowStack.lenght > 0) {
                            modalWindowStack[0].parent().on('keydown', function(e){
                                if(e.keyCode === $.ui.keyCode.ESCAPE) { 
                                    modalWindowStack[0].parent().off('keydown');
                                    modalWindowStack[0].dialog('close');
                                } 
                                e.stopPropagation();
                            });                        
                        } else {
                            $('body').removeClass('modal-open');
                        }
                    }
                    if ( modalWindowStack.length <= 0 ) {
                        $('body').removeClass('modal-open');
                    }
                },
                beforeClose: function(event, ui) {
                        if (modalWindowStack[0].find('form').attr('changed') == 'true' & ! changealertOff) {
                            modalAskWindow(extbaseAjax.discard, 
                                function() {
                                    // function on yes
                                    $myWindow = modalWindowStack.shift();
                                    dialogClose($myWindow);
                                },
                                function() {
                                    // function on no
                                }
                            );
                            return false;
                        } else {
                            $myWindow = modalWindowStack.shift();
                            dialogClose($myWindow);
                        }
                    },
                create: function(event, ui) {
                    if (typeof(icon) != 'undefined') {
                        // htmlImgTag = '<img style="display: block; float: left; width: 28px; height: 28px; margin-right: 10px;" alt="" src="' + icon + '" />'; 
                        $(this).prev('.ui-dialog-titlebar').prepend(icon);
                    }
                }
            });

            topPos = 20;
            modalWindowStack[0].parent().css('top', topPos + 'px');
            
            // activateWarning( $('#modalWindow_' + elementid) );
            activateWarning(modalWindowStack[0]);
            modalWindowStack[0].dialog('open');

            test = modalWindowStack[0].dialog('option', 'position');
            
            if (readonly) {
                modalWindowStack[0].find('input, select, textarea').attr('disabled',true);
            }
				try {if (typeof(onshow) == 'function') onshow();}
				catch (error) {alert('Error #76359: onshow failed' + error);}
				autoAjax();
			}});
		}
}

/**
 * funtion modalMessageInvoke
 * 
 * @param {string} title
 * @param {string} text
 * @param {string} buttontext
 * @param {function} onshow
 * @param {function} onsave
 * @param {string} width
 * @param {string} height
 * @returns {undefined}
 */
function modalMessageInvoke (title, text, buttontext, onshow, onsave, width, height) {
    if (typeof(width) == 'undefined') width = 'auto';
    if (typeof(height) == 'undefined') height = 'auto';
    if (typeof(onshow) !== 'function') onshow = makeFn(onshow);
    if (typeof(onsave) !== 'function') onsave = makeFn(onsave);

    // create random id for modal window stack
    var elementid = randomString(16);

    // add div tag at the beginning of the document, will be used by modalForm
	$( 'body' ).prepend('<div id="modalWindow_' + elementid + '" class="modalWindow"></div>');
	
    // add new window element add top off stack
    modalWindowStack.unshift($( '#modalWindow_' + elementid ));

    // write text to window as content
    modalWindowStack[0].addClass('extbase_ajax_modal_message');
    modalWindowStack[0].html('<a style="display: block; width: 1px; height: 1px; overflow: hidden; position: absolute;" href="#"> </a>' + text);

    var buttons = [
            {text: buttontext, click: function() {$myWindow  = modalWindowStack.shift(); dialogClose($myWindow);}}
        ];

    // invoke jQuery dialogue
    returnCode = modalWindowStack[0].dialog({
        autoOpen: false,
        autoResize: true,
        resizable: false,
        show: 'fade',
        hide: 'fade',
        modal: true, 
        autoOpen: false,
        title: title,
        width: width,
        height: height,
        closeOnEscape: true,
        buttons: buttons,
        open: function() {
            $('body').addClass('modal-open');

            modalWindowStack[0].keypress(function(e) {
              if ((e.keyCode == $.ui.keyCode.ENTER)) {
                $(this).parent().find('.ui-dialog-buttonpane button:first').click();
                return false;
              }
              if (e.keyCode == $.ui.keyCode.ESC) {
                alert('esc')
              }
          });
        },
        close: function(ev, ui) {
            if ( modalWindowStack[0] && ($(this).attr('id') == modalWindowStack[0].attr('id')) ) {
                $myWindow  = modalWindowStack.shift(); 
                dialogClose($myWindow);
                if (modalWindowStack.lenght > 0) {
                    modalWindowStack[0].parent().on('keydown', function(e){
                        if(e.keyCode === $.ui.keyCode.ESCAPE) { 
                            modalWindowStack[0].parent().off('keydown');
                            modalWindowStack[0].dialog('close');
                        } 
                        e.stopPropagation();
                    });                        
                } else {
                    $('body').removeClass('modal-open');
                }
            }
            if ( modalWindowStack.length <= 0 ) {
                $('body').removeClass('modal-open');
            }
        },
        beforeClose: function(event, ui) {
            }

    });
    
    modalWindowStack[0].dialog('open');

    modalWindowStack[0].on('keydown', function(e){
        if(e.keyCode === $.ui.keyCode.ESCAPE) { 
            modalWindowStack[0].off('keydown');
            modalWindowStack[0].dialog('close');
        } 
        e.stopPropagation();
    });

    try {if (typeof(onshow) == 'function') onshow();}
    catch (error) {alert('Error 1471185278: onshow failed' + error);}
    autoAjax();

}


/**
 * 
 * @param {object} $dialog
 * @param {boolean} forceDialogClose
 * @returns {undefined}
 */
function dialogClose($dialog) {
    // alert('close');
    dialogDestroy($dialog);
}

/**
 * 
 * @param {object} $dialog
 * @returns {undefined}
 */
function dialogDestroy($dialog) {
    // $dialog.find('*').unbind();
    if (typeof($dialog) !== 'undefined') {
        $dialog.parent().off('keydown');
        $dialog.dialog('destroy');	
        $dialog.detach();
        $dialog.remove();
        delete $dialog;
    }
    $('body').removeClass('modal-open');
}
