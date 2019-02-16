" File: init.vim
" Entry point for GUI functions

if exists('g:loaded_gui_functions')
    finish
endif

let g:loaded_gui_functions = 1


function! GUI_notify(method, args)
    call rpcnotify(1, a:method, a:args)
endfunction

function! GUI_notifyAutocmd(eventName)
    call GUI_notify('autocmd', [a:eventName, GUI_GetContext()])
endfunction

function! GUI_command(cmdName, ...)
    call GUI_notify('command', [a:cmdName, a:000])
endfunction

function! GUI_GetContext()
  let bufferNumber = bufnr('%')
  let line = line('.')
  let column = col('.')

  return [bufferNumber, line, column]
endfunction


" Commands

command!               FileFinder :call GUI_command('FileFinder')

" TODO(auto-complete available fonts)"
" TODO(use finder for this)
command! -bar -nargs=1 GuiFont :call GUI_command('GuiFont', <f-args>)


" Auto-commands

augroup GUIEventListeners
    autocmd!
    " autocmd! BufWritePre  * :call GUI_notifyAutocmd('BufWritePre')
    " autocmd! BufWritePost * :call GUI_notifyAutocmd('BufWritePost')
    " autocmd! BufEnter     * :call GUI_notifyAutocmd('BufEnter')
    " autocmd! BufRead      * :call GUI_notifyAutocmd('BufRead')
    " autocmd! BufWinEnter  * :call GUI_notifyAutocmd('BufWinEnter')
    " autocmd! BufDelete    * :call GUI_notifyAutocmd('BufDelete')
    " autocmd! BufUnload    * :call GUI_notifyAutocmd('BufUnload')
    " autocmd! BufWipeout   * :call GUI_notifyAutocmd('BufWipeout')
    " autocmd! CursorMoved  * :call GUI_notifyAutocmd('CursorMoved')
    " autocmd! CursorMovedI * :call GUI_notifyAutocmd('CursorMovedI')
augroup END

