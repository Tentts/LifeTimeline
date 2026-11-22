# Development workflow

```
feat/<feature-name> ──merge──▶ dev ──release──▶ main ──GitHub Actions──▶ GitHub Pages
```

| Branch           | Purpose                                                      | Deploys? |
| ---------------- | ------------------------------------------------------------ | -------- |
| `main`           | Released versions only. Every push here publishes the site.  | **Yes**  |
| `dev`            | Integration branch: finished features waiting for a release. | No       |
| `feat/<feature>` | One branch per feature, created from `dev`.                  | No       |

CI (lint, format, tests, build) runs on every push to all of these branches and on pull requests.
Only `main` is deployed to <https://tentts.github.io/LifeTimeline/>.

## Working on a feature

```sh
git switch dev
git pull
git switch -c feat/<feature-name>
# ...work, commit...
git push -u origin feat/<feature-name>
```

When the feature is finished and checks pass, merge it into `dev`:

```sh
git switch dev
git pull
git merge --no-ff feat/<feature-name>
git push
git branch -d feat/<feature-name>
git push origin --delete feat/<feature-name>
```

## Releasing (dev → main)

Versions are bumped **only** when releasing. Use [semantic versioning](https://semver.org/):
patch for fixes, minor for new features.

```sh
git switch main
git pull
git merge --no-ff dev
npm version <x.y.z> --no-git-tag-version
git commit -am "Release <x.y.z>"
git tag -a v<x.y.z> -m "v<x.y.z>: <summary>"
git push --follow-tags origin main
git switch dev
git merge main        # bring the version bump back into dev
git push
```

The push to `main` triggers the GitHub Actions workflow, which checks, builds and publishes the
site. The footer shows the released version.
