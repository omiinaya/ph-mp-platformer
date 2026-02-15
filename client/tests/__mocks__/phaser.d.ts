declare module 'phaser' {
  export const Game: any;
  export const Scene: any;
  export const GameObjects: {
    Sprite: any;
  };
  export const Physics: {
    Arcade: {
      Sprite: any;
    };
  };
  export const Math: {
    Vector2: any;
    Vector3: any;
  };
  export const Utils: {
    String: {
      UUID: () => string;
    };
  };
}
