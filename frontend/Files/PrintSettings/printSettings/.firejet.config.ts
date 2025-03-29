import { FJ } from "@firejet/cli";

const config: FJ.FireJetConfig = {
  groups: {
    default: {
      components: {
        IPhoneSe: {
          defaultExport: true,
          path: "src/components/IPhoneSe.tsx",
          exportName: "IPhoneSe",
          structure: {
            type: "component",
            name: "IPhoneSe",
            children: [],
            props: {},
          },
        },
      },
      globalCss: ["./styles.css"],
      postcssPath: "./postcss.config.js",
    },
  },
};

export default config;
