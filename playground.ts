import { keyboardInput, beginListeningToKeyboard, stopListeningToKeyboard } from "./mod.ts";

beginListeningToKeyboard();
for await ( const hit of keyboardInput() ) {
	console.log( hit );
	if ( hit.type == 'text' && hit.controlPressed && hit.text == 'c' )
		break;
}

stopListeningToKeyboard();