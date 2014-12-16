import runloop from 'global/runloop';
import { getKeypath } from 'shared/keypaths';
import { isEqual } from 'utils/is';
import getPattern from './getPattern';

var PatternObserver, wildcard = /\*/, slice = Array.prototype.slice;

PatternObserver = function ( ractive, keypath, callback, options ) {
	this.root = ractive;

	this.callback = callback;
	this.defer = options.defer;

	this.keypath = keypath;
	this.regex = new RegExp( '^' + keypath.str.replace( /\./g, '\\.' ).replace( /\*/g, '([^\\.]+)' ) + '$' );
	this.values = {};

	if ( this.defer ) {
		this.proxies = [];
	}

	// default to root as context, but allow it to be overridden
	this.context = ( options && options.context ? options.context : ractive );
};

PatternObserver.prototype = {
	init: function ( immediate ) {
		var values, keypath;

		values = getPattern( this.root, this.keypath );

		if ( immediate !== false ) {
			for ( keypath in values ) {
				if ( values.hasOwnProperty( keypath ) ) {
					this.update( getKeypath( keypath ) );
				}
			}
		} else {
			this.values = values;
		}
	},

	update: function ( keypath ) {
		var values;

		if ( typeof keypath === 'string' ) {
			throw new Error( 'string' );
		}

		if ( wildcard.test( keypath ) ) {
			values = getPattern( this.root, keypath );

			for ( keypath in values ) {
				if ( values.hasOwnProperty( keypath ) ) {
					this.update( getKeypath( keypath ) );
				}
			}

			return;
		}

		// special case - array mutation should not trigger `array.*`
		// pattern observer with `array.length`
		if ( this.root.viewmodel.implicitChanges[ keypath ] ) {
			return;
		}

		if ( this.defer && this.ready ) {
			runloop.scheduleTask( () => this.getProxy( getKeypath( keypath ) ).update() );
			return;
		}

		this.reallyUpdate( keypath );
	},

	reallyUpdate: function ( keypath ) {
		var value, keys, args;

		if ( typeof keypath === 'string' ) {
			throw new Error( 'string' );
		}

		value = this.root.viewmodel.get( keypath );

		// Prevent infinite loops
		if ( this.updating ) {
			this.values[ keypath ] = value;
			return;
		}

		this.updating = true;

		if ( !isEqual( value, this.values[ keypath ] ) || !this.ready ) {
			keys = slice.call( this.regex.exec( keypath ), 1 );
			args = [ value, this.values[ keypath ], keypath.str ].concat( keys );

			this.values[ keypath ] = value;
			this.callback.apply( this.context, args );
		}

		this.updating = false;
	},

	getProxy: function ( keypath ) {
		if ( !this.proxies[ keypath ] ) {
			this.proxies[ keypath ] = {
				update: () => this.reallyUpdate( keypath )
			};
		}

		return this.proxies[ keypath ];
	}
};

export default PatternObserver;
