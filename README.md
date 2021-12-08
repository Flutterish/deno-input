# deno-input
A library for `Deno` which allows you to asynchronously listen to keyboard input. It requires the `--unstable` flag.

In the future this will also read cursor selection in the console.

Currently, special characters such as arrow keys use a native library on Windows and require the `--allow-ffi` and `--allow-env` flags.

Example usage:
```ts
import { keyboardInput, beginListeningToKeyboard, stopListeningToKeyboard } from "https://deno.land/x/deno_input";

beginListeningToKeyboard();
for await ( const hit of keyboardInput() ) {
	console.log( hit );
	if ( hit.type == 'text' && hit.controlPressed && hit.text == 'c' )
		break;
}

stopListeningToKeyboard();
```