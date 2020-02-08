# Contributing to Caim

Thanks for taking the time to make Caim better! :tada: :smile:

> **Note**: These contributing guidelines are adapted from the [Atom Project's Contributing
   Guidelines](https://github.com/atom/atom/blob/master/CONTRIBUTING.md).

#### Table of Contents

[Code of Conduct](#code-of-conduct)

[How can I contribute?](#how-can-i-contribute)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting Features](#suggesting-features)
  * [Your First Code Contribution](#your-first-code-contribution)
  * [Pull Requests](#pull-requests)

[Style Guides](#style-guides)
  * [Git Commit Messages](#git-commit-messages)

[Additional Notes](#additional-notes)

## Code of Conduct

This project, and everyone participating in it, is governed by the [Caim Code of
Conduct](CODE_OF_CONDUCT.md).  By participating, you are expected to uphold this code. Please report
unacceptable behavior to [emergence@asu.edu](mailto:emergence@asu.edu).

## How can I contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Caim. Following these guidelines
helps maintainers and the community understand your report, reproduce the behavior, and find related
reports.

Before creating bug reports, perform a [cursory
search](https://github.com/search?utf8=%E2%9C%93&q=+is%3Aissue+repo%3Adglmoore%2Fcaim&type=) to
see if the problem has already been reported. If it has **and the issue is still open**, add a
comment to the existing issue instead of opening a new one. If you find a **closed** issue that
seems like it is the same thing that you're experiencing, open a new issue and include a link to the
original issue in the body of your new one.

#### How do I submit a bug report?

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). After you are sure the bug is either
new, or needs to be readdressed, create an issue and provide the following information by filling in
[the template](.github/ISSUE_TEMPLATE/bug_report.md).

Explain the problem and include addition details to help maintainers reproduce the problem:

  * **Use a clear and descriptive title** for the issue to identify the problem.
  * **Describe the exact steps which reproduce the problem** in as many details as possible. For
    example, include a minimal script to reproduce the bug.
  * **Describe the behavior you observed from the script** and point out exactly what the problem is
    with that behavior. For example, include any output you observe and explain what is wrong with
    it.
  * **Explain what behavior you expected to see instead and why.**

Provide more context by answering these questions:

  * **Did the problem start happening recently** (e.g. after updating to a new version of Caim)
    or was this always a problem?
  * If this problem started recently, **can you reproduce the problem in an older version of
    Caim?** What is the most recent version of Caim which does not have this bug?
  * **Can you reliably reproduce the issue?** If not, provide details about how often the problem
    happens and under which conditions it typically occurs.
  * If the problem is related to working with external resources (e.g. data files, network
    connections, etc...), **does the problem happen for all resources, or only some?** For example,
    is there a particular data file that seems to cause problems, or are all data file an issue?

Include details about your configuration

  * **Which version of Caim are you using?**
  * **What's the name and version of the Operating System you are using?**

### Suggesting Features

This section guides you through submitting an feature suggestion for Caim, including completely
new features and minor improvements to existing functionality. Following these guidelines helps
maintainers and the community understand your suggestion, find related suggestions, and prioritize
feature development.

Before creating a feature request, perform a [cursory search](https://github.com/search?utf8=%E2%9C%93&q=+is%3Aissue+repo%3Adglmoore%2Fcaim+label%3A%22feature+request%22+&type=) to see if it has
already been suggested. If it has, add a comment to the existing issue instead of opening a new one.

#### How do I submit a feature request?

Feature requests are tracked [GitHub issues](https://guides.github.com/features/issues/). After you are sure the
request is not a duplicate, create an issue and provide the following information by filling in
[the template](.github/ISSUE_TEMPLATE/feature_request.md).

  * **Use a clear and descriptive title** for the issue to identify the suggestion.
  * **Provide a description of the feature** in as much detail as possible.
  * **Propose an API for the feature** to demonstrate how that feature fits in with the rest of
    Caim.
  * **Give and example usage** for the proposed API. Of course, the output is not necessary.
  * **Reference any resources** on which the feature is based. The references should any
    mathematical details necessary for implementing the feature, e.g. defining equations.

### Your First Code Contribution

Your contributions are more than welcome!  before you get started It's also advisable that you read
through the [API documentation](https://dglmoore.com/caim/) to make sure that
you fully understand how the various components of Caim interact.

For external contributions, we use [GitHub forks](https://guides.github.com/activities/forking/) and
[pull requests](https://guides.github.com/activities/forking/#making-a-pull-request) workflow. To
get started with contributing code, you first need to fork Caim to one of your accounts. As you
begin development, have several recommendations that will make your life easier.

 * **Do not work directly on master.** Create a branch for whatever feature or bug you are currently
   working on.
 * **Create a [draft pull
   request](https://github.blog/2019-02-14-introducing-draft-pull-requests/)** after you first push
   to your fork. This will ensure that the rest of the Caim community knows that you are working
   on a given feature or bug.
 * **Fetch changes from [dglmoore/caim](https://github.com/dglmoore/caim)'s master branch
   often** and merge them into your working branch. This will reduce the number and severity of
   merge conflicts that you will have to deal with. [How do I fetch changes from
   dglmoor/caim?](#how-do-i-fetch-changes-from-dglmoorecaim)

### Pull Requests

The Fork-Pull Request process described here has several goals:

  * Maintain Caim's quality
  * Quickly fix problems with Caim that are important to users
  * Enage the community in working to make Caim as near to perfect as possible
  * Enable a sustainable system for Caim's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

  1. **Use a clear and descriptive title** for your pull request.
  2. Follow all instructions in the [pull request
     template](.github/pull_request_template.md).
  3. Follow the [styleguides](#styleguides)
  4. After you submit your pull request, verify that all
     [status checks](https://help.github.com/articles/about-status-checks/) are passing.
     <details>
       <summary>What if the status checks are failing?</summary>
       If a status check is failing, it is your responsibility to fix any problems. Of course the
       maintainers are here to help, so please post a comment on the pull request if you need any
       support from us. If you believe that the failure is unrelated to your change, please leave a
       comment on the pull request explaining why you believe that to be the case. A maintainer will
       re-run the status checks for you. If we conclude that the failure was a false positive, then
       we will open an issue to track that problem with our own status check suite.
     </details>

## Style Guides

### Git Commit Messages

* Use the present tense ("Add PrisonersDilemma" not "Added PrisonersDilemma")
* Use the imperative mood ("Add duration parameter..." not "Adds duration parameter...")
* Limit the first line to 72 characters or less
* Reference isses and pull requests liberally after the first line
* When only changing documentation, include `[ci skip]` in the commit title
* Consider starting the commit message with an applicable emoji:
    - :art: `:art:` when improving the format/structure of the code
    - :racehorse: `:racehorse:` when improving performance
    - :memo: `:memo:` when writing documentation
    - :penguin: `:penguin:` when fixing something on Linux
    - :apple: `:apple:` when fixing something on maxOS
    - :checkered_flag: `:checkered_flag:` when fixing something on Window
    - :bug: `:bug:` when fixing a bug
    - :hammer: `:hammer:` when adding code or files
    - :fire: `:fire:` when removing code or files
    - :green_heart: `:green_heart:` when fixing the CI build
    - :heavy_check_mark: `:heavy_check_mark:` when adding tests
    - :arrow_up: `:arrow_up:` when upgrading dependencies
    - :arrow_down: `:arrow_down:` when downgrading dependencies
    - :shirt: `:shirt:` when dealing with linter warnings

## Additional Notes

### How do I fetch changes from dglmoore/caim?

After you have cloned your fork, add the [dglmoore/caim](https://github.com/dglmoore/caim) as
a remote:
```shell
$ git add remote dglmoore https://github.com/dglmoore/caim.git
```
To fetch changes from dglmoore/caim's master branch:
```shell
$ git fetch dglmoore master
```
This will get all of the changes from the main repository's master branch, but it will not merge any
of those changes into your local working branchs. To do that, use `merge`:
```shell
$ git checkout master
$ git merge dglmoore/master
...
```
You can then merge the changes into your feature branch (say `mask`)
```shell
$ git checkout mask
$ git merge master
```
and then deal with any merge conflicts as usual.
