export type Action = 
	'backspace' | 'delete' | 'insert' |
	'left' | 'right' | 'up' | 'down' |
	'enter' | 'tab' | 'escape' |
	'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' |
	'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' |
	'home' | 'page up' | 'end' | 'page down';

export type KeyHit = ({
	type: 'text',
	text: string,
	shiftPressed?: boolean,
	controlPressed?: boolean,
	altPressed?: boolean
} | {
	type: 'control',
	action: Action
		
} | {
	type: 'unknown'
}) & { code: ArrayLike<number> };

const controlCodes: {[code: number]: Action} = {
	127: 'backspace',
	8: 'backspace',
	13: 'enter',
	9: 'tab',
	27: 'escape'
};

const extendedCodes0: {[code: number]: Action} = {
	59: 'F1',
	60: 'F2',
	61: 'F3',
	62: 'F4',
	63: 'F5',
	64: 'F6',
	65: 'F7',
	66: 'F8',
	67: 'F9',
	68: 'F10',
	133: 'F11',
	134: 'F12',

	72: 'up',
	75: 'left',
	77: 'right',
	80: 'down',

	71: 'home',
	79: 'end',

	73: 'page up',
	81: 'page down',

	82: 'insert',

	83: 'delete'
};

const extendedCodes224: {[code: number]: Action} = {
	133: 'F11',
	134: 'F12',

	71: 'home',
	79: 'end',

	73: 'page up',
	81: 'page down',

	82: 'insert',

	83: 'delete'
};

function parseKeyHits ( code: Uint8Array, count: number ): KeyHit[] {
	let arr: KeyHit[] = [];

	let i = 0;
	while ( i < count ) {
		if ( code[i] == 0 || code[i] == 244 ) {
			arr.push( parseKeyHit( code.subarray(i, i + 2), 2 ) );
			i += 2; 
		}
		else {
			arr.push( parseKeyHit( code.subarray(i, i + 1), 1 ) );
			i += 1; 
		}
	}

	return arr;
};

// https://www.asciitable.com
// http://microvga.com/ansi-keycodes
function parseKeyHit ( code: Uint8Array, count: number ): KeyHit {
	if ( count == 2 ) {
		if ( code[0] == 0 && extendedCodes0[code[1]] != undefined ) {
			return {
				type: 'control',
				action: extendedCodes0[code[1]],
				code: code
			};
		}

		if ( code[0] == 224 && extendedCodes224[code[1]] != undefined ) {
			return {
				type: 'control',
				action: extendedCodes224[code[1]],
				code: code
			};
		}

		return {
			type: 'unknown',
			code: code
		};
	}

	// count == 1
	let key = code[0];

	if ( controlCodes[ key ] != undefined ) {
		return {
			type: 'control',
			action: controlCodes[ key ],
			code: code
		};
	}

	if ( key >= 32 && key <= 126 ) { // printable ascii characters 
		return {
			type: 'text',
			text: String.fromCharCode( key ),
			shiftPressed: (key >= 33 && key <= 43) 
				|| key == 58 || key == 60 
				|| (key >= 62 && key <= 90) 
				|| key == 94 || key == 95 
				|| (key >= 123 && key <= 126),
			code: code
		};
	}

	if ( key >= 1 && key <= 26 ) { // control + letter
		return {
			type: 'text',
			text: String.fromCharCode( key + 96 ),
			controlPressed: true,
			code: code
		};
	}

	return {
		type: 'unknown',
		code: code
	};
}

var isListening = false;
var cleanupActions: (() => any)[] = [];

export function beginListeningToKeyboard () {
	if ( isListening ) {
		throw 'deno-input is already listening to keyboard input';
	}
	isListening = true;
	
	Deno.setRaw( Deno.stdin.rid, true );
	cleanupActions.push( () => Deno.setRaw( Deno.stdin.rid, false ) );
}

export async function* keyboardInput () {
	if ( !isListening ) {
		throw 'deno-input is not listening to keyboard input. Make sure to call `beginListeningToKeyboard` before and `stopListeningToKeyboard` after calling `keyboardInput`';
	}

	const buffer = new Uint8Array( 512 );

	if ( Deno.build.os == 'windows' ) {
		const SysRoot = Deno.env.get( 'SystemRoot' );
		const conio = Deno.dlopen( `${SysRoot}\\system32\\msvcrt.dll`, {
			'_getch': { parameters: [], result: 'i32' },
			'_kbhit': { parameters: [], result: 'i32' }
		} );
		cleanupActions.push( () => conio.close() );

		const available = conio.symbols._kbhit as () => boolean;
		const nextKey = conio.symbols._getch as () => number;

		while ( true ) {
			let n = 0;
			buffer[n++] = await nextKey();
			while ( available() ) {
				buffer[n++] = nextKey();
			}

			for ( const hit of parseKeyHits( buffer, n ) ) {
				yield hit;
			}
		}
	}
	else {
		while ( true ) {
			let n = await Deno.stdin.read( buffer );
			if ( n == null )
				continue;

			for ( const hit of parseKeyHits( buffer, n ) ) {
				yield hit;
			}
		}
	}
}

export function stopListeningToKeyboard () {
	if ( !isListening ) {
		throw 'deno-input is not listening to keyboard input';
	}
	isListening = false;

	for ( const action of cleanupActions ) {
		action();
	}
	cleanupActions = [];
}