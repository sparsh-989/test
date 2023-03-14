const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function main() {
  const { data: codeOwnersContent } = await octokit.repos.getContent({
    owner: process.env.GITHUB_REPOSITORY.split("/")[0],
    repo: process.env.GITHUB_REPOSITORY.split("/")[1],
    path: "CODEOWNERS",
  });

  const codeOwnersFile = Buffer.from(codeOwnersContent.content, "base64").toString();
  const codeOwners = codeOwnersFile.split("\n").filter(Boolean);
  const files = [];

  for (const codeOwner of codeOwners) {
    const [file, ...owners] = codeOwner.split(/\s+/);
    if (owners.includes(process.env.GITHUB_ACTOR)) {
      files.push(file);
    }
  }

  const { data: repos } = await octokit.repos.listForUser({
    username: process.env.GITHUB_ACTOR,
  });

  const repoNames = repos.map((repo) => repo.name);

  const yaml = `
  files:
    - ${files.join("\n    - ")}
  repos:
    - ${repoNames.join("\n    - ")}
  `;

  fs.writeFileSync("output.yml", yaml);
}

main();
