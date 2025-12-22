import resolve from "@rollup/plugin-node-resolve";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

function babelOutput(ie11) {
  const targets = ie11
    ? { ie: "11" }
    : { chrome: "60" };
  return getBabelOutputPlugin({
    allowAllFormats: true,
    babelrc: false,
    runtimeHelpers: true,
    compact: false,
    comments: false,
    presets: [
      ["@babel/env", {
        targets,
        useBuiltIns: "entry",
        corejs: 3,
      }],
    ],
  });
}


//#region Browser
export default [
  {
    input: "src/shim.ts",
    plugins: [
      resolve({
        mainFields: ["esnext", "module", "main"],
        preferBuiltins: true,
      }),
      // nodePolyfills(),
      commonjs(),
      typescript({
        check: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            module: "es2015",
          }
        }
      }),
    ],
    output: [
      {
        file: pkg.main,
        format: "iife",
        name: "liner",
        plugins: [
          babelOutput(false)
        ]
      }
    ]
  },
];
