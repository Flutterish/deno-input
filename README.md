# deno-input
A library for `Deno` which allows you to asynchronously listen to keyboard input. It requires the `--unstable` flag.

Currently, special characters such as arrow keys use a native library on Windows and require the `--allow-ffi` and `--allow-env` flags.

Example usage:
```ts
import { keyboardInput, beginListeningToKeyboard, stopListeningToKeyboard } from "path-to-deno-input.ts";

beginListeningToKeyboard();
for await ( const hit of keyboardInput() ) {
	console.log( hit );
	if ( hit.type == 'text' && hit.controlPressed && hit.text == 'c' )
		break;
}

stopListeningToKeyboard();
``