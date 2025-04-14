const { ModuleFederationPlugin } = require("webpack").container;
const { NormalModuleReplacementPlugin } = require("webpack");
const path = require("path");
const fs = require("fs");

const get3rdServices = async () => [
  {
    url: "http://localhost:3000/version.json",
    name: "shared_vendors",
  },
];

const get2ndServices = async () => [
  {
    url: "http://localhost:3002/version.json",
    name: "app2",
  },
];

const getRemoteModules = async ({ remote, packageName }) => {
  if (!remote) {
    return {
      remotes: {},
      replacePlugins: [],
    };
  }
  const shared3rdServices = await get3rdServices();
  const shared2ndServices = await get2ndServices();

  const fetchService = async (services) => {
    return (await Promise.all(services.map((service) => {
      // 如果是当前包，则不需要请求
      if (service.name === packageName) {
        return null;
      }
      // 请求共享模块的版本信息
      return fetch(service.url)
        .then((response) => response.json())
        .catch(() => {
          console.error(`无法访问共享模块 ${service.name}，请确保它正在运行。`);
          process.exit(1);
        });
    }))).filter(Boolean);
  };

  const all3rdVersions = await fetchService(shared3rdServices)
  const all2ndVersions = await fetchService(shared2ndServices)

  const replacePlugins = [];
  const remotes = {};

  // 从packages数组构建正则表达式模式
  all3rdVersions.forEach((version) => {
    const packagesPattern = version.packages
      .map((pkg) => pkg.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")) // 转义特殊正则字符
      .join("|");

    // 创建正则表达式
    const modulesRegex = new RegExp(`^(${packagesPattern})($|\/)`);

    console.log("共享包:", version.packages);
    console.log("模块正则:", modulesRegex);

    // 添加远程模块
    remotes[version.name] = `${version.name}@${version.url}`;

    // 添加模块替换插件
    replacePlugins.push(
      new NormalModuleReplacementPlugin(
        modulesRegex, // 匹配需要替换的模块
        (resource) => {
          if (version.packages.includes(resource.request)) {
            console.log(
              `替换: ${resource.request} -> ${version.name}/${resource.request}`
            );
            resource.request = `${version.name}/${resource.request}`;
          }
        }
      )
    );
  });

  all2ndVersions.forEach((version) => {
    // 添加远程模块
    remotes[version.name] = `${version.name}@${version.url}`;
  });

  console.log("远程模块:", remotes);
  return { remotes, replacePlugins };
};

const webpackFederationConfig = async ({
  packageName,
  sharedPackages = {},
  entry = "remoteEntry.js",
  publicPath = "/",
  remote = true,
}) => {
  const packages = Object.keys(sharedPackages);
  // 创建可用包的清单
  const packageManifest = {
    packages: packages,
    name: packageName,
    url: `${publicPath}${entry}`,
  };

  const { remotes, replacePlugins } = await getRemoteModules({
    remote,
    packageName,
  });

  const plugins = [
    ...replacePlugins,
    new ModuleFederationPlugin({
      name: packageName,
      filename: entry,
      remotes: remotes,
      exposes: Object.entries(sharedPackages).reduce((acc, [key, value]) => {
        acc[`./${key}`] = value;
        return acc;
      }, {}),
    }),
    packages.length === 0
      ? null
      : {
          apply(compiler) {
            compiler.hooks.afterEmit.tap(
              "GeneratePackageManifest",
              (compilation) => {
                fs.writeFileSync(
                  path.join(compiler.outputPath, "version.json"),
                  JSON.stringify(packageManifest, null, 2)
                );
              }
            );
          },
        },
  ].filter(Boolean);

  return {
    plugins,
  };
};

module.exports = webpackFederationConfig;
