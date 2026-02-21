// Mock Phaser for testing
const mockSprite = jest.fn().mockImplementation(function () {
  this.x = 0;
  this.y = 0;
  this.texture = { key: 'default' };
  this.setCollideWorldBounds = jest.fn().mockReturnThis();
  this.setBounce = jest.fn().mockReturnThis();
  this.setDrag = jest.fn().mockReturnThis();
  this.setVelocity = jest.fn().mockReturnThis();
  this.setPosition = jest.fn().mockReturnThis();
  this.setScale = jest.fn().mockReturnThis();
  this.setTint = jest.fn().mockReturnThis();
  this.play = jest.fn().mockReturnThis();
  this.setFlipX = jest.fn().mockReturnThis();
  this.on = jest.fn().mockReturnThis();
  this.off = jest.fn().mockReturnThis();
  this.destroy = jest.fn();
  this.active = true;
  this.body = {
    setSize: jest.fn(),
    setOffset: jest.fn(),
    velocity: { x: 0, y: 0 },
    blocked: { down: false },
    touching: { down: false },
    enable: true,
    setImmovable: jest.fn(),
    setAllowGravity: jest.fn(),
    setEnable: jest.fn(),
  };
  this.anims = {
    play: jest.fn(),
    exists: jest.fn().mockReturnValue(true),
    create: jest.fn(),
  };
});

// Mock EventEmitter for Phaser
class MockEventEmitter {
  constructor() {
    this._events = {};
  }
  on(event, callback) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(callback);
    return this;
  }
  off(event, callback) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter((cb) => cb !== callback);
    }
    return this;
  }
  emit(event, ...args) {
    if (this._events[event]) {
      this._events[event].forEach((cb) => cb(...args));
    }
    return this;
  }
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }
}

class MockVector2 {
  x = 0;
  y = 0;
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}

class MockVector3 {
  x = 0;
  y = 0;
  z = 0;
}

const Phaser = {
  Game: jest.fn(),
  Events: {
    EventEmitter: MockEventEmitter,
  },
  Scene: jest.fn().mockImplementation(() => ({
    add: {
      sprite: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setData: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
    },
    physics: {
      add: {
        existing: jest.fn().mockReturnValue({
          body: {
            setImmovable: jest.fn(),
            setAllowGravity: jest.fn(),
            enable: true,
            setEnable: jest.fn(),
          },
        }),
      },
    },
    tweens: {
      add: jest.fn().mockReturnValue({ destroy: jest.fn() }),
    },
    time: {
      delayedCall: jest.fn(),
    },
    events: {
      emit: jest.fn(),
    },
    sound: {
      play: jest.fn(),
    },
    cameras: {
      main: {
        worldView: { x: 0, y: 0, width: 800, height: 600 },
      },
    },
  })),
  GameObjects: {
    Sprite: mockSprite,
  },
  Physics: {
    Arcade: {
      Sprite: mockSprite,
      Body: class MockBody {
        setSize = jest.fn();
        setOffset = jest.fn();
        velocity = { x: 0, y: 0 };
        blocked = { down: false };
        touching = { down: false };
        enable = true;
      },
    },
  },
  Math: {
    Vector2: MockVector2,
    Vector3: MockVector3,
    DegToRad: jest.fn((deg) => (deg * Math.PI) / 180),
    RadToDeg: jest.fn((rad) => (rad * 180) / Math.PI),
    Distance: {
      Between: jest.fn(),
    },
    Random: {
      UUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  },
  Utils: {
    String: {
      UUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  },
  Time: {
    TimerEvent: jest.fn(),
  },
  Tweens: {
    Tween: jest.fn(),
  },
  Cameras: {
    Scene2D: {
      Camera: jest.fn(),
    },
  },
};

module.exports = Phaser;
module.exports.default = Phaser;
