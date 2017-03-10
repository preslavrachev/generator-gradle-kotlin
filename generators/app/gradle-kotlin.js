'use strict'
let _ = require('lodash')
let YeomanGenerator = require('yeoman-generator')
let chalk = require('chalk')
let yosay = require('yosay')
let os = require('os')
let Promise = require('promise')
let request = Promise.denodeify(require('request'))
let exec = Promise.denodeify(require('child_process').exec)

const DEFAULT_GRADLE_VERSION = '2.7'
const DEFAULT_KOTLIN_VERSION = '1.1.0'
const MVNCNTRL_KOTLIN_SEARCH = 'http://search.maven.org/solrsearch/select?q=g:org.jetbrains.kotlin%20AND%20a:kotlin-stdlib&wt=json'

// # class GradleKotlinGenerator extends yeoman.Base
// #   constructor: (args, options, config) ->
// #     super(args, options, config)

// #   prompts:
// #     projectName:
// #       type: 'input'
// #       name: 'projectName'
// #       message: "What's your project name?"
// #     gradleVersion:
// #       type: 'input'
// #       name: 'gradleVersion'
// #       message: 'What Gradle version would you like to use?'
// #     kotlinVersion:
// #       type: 'input'
// #       name: 'kotlinVersion'
// #       message: 'What Kotlin version would you like to use?'
// #     useReflect:
// #       type: 'confirm'
// #       name: 'useReflect'
// #       message: 'Do you want to use Kotlin Reflection?'
// #       default: true
// #     ideaPlugin:
// #       type: 'confirm'
// #       name: 'ideaPlugin'
// #       message: 'Would you like to use IDEA Gradle plugin?'
// #       default: true

// #   initializing: ->
// #     @log yosay "Welcome to the incredible #{chalk.bgGreen 'Gradle'}+#{chalk.bgBlue 'Kotlin'} generator!"

// #     done = @async()
// #     Promise.all([@_fetchGradleVersion(), @_fetchKotlinVersion(), @_getProjectName()]).then -> done()

// #   prompting: ->
// #     done = @async()
// #     @prompt _.values(@prompts), (props) =>
// #       @props = props
// #       done()

// #   writing:
// #     app: ->
// #       @fs.copy(@templatePath('gitignore'), @destinationPath('.gitignore'))
// #       @fs.copy(@templatePath('gitkeep'), @destinationPath('src/main/kotlin/.gitkeep'))
// #       @fs.copy(@templatePath('gitkeep'), @destinationPath('src/test/kotlin/.gitkeep'))
// #       @template(@templatePath('build.gradle.ejs'), @destinationPath('build.gradle'))
// #       @template(@templatePath('gradle.properties.ejs'), @destinationPath('gradle.properties'))
// #       @template(@templatePath('settings.gradle.ejs'), @destinationPath('settings.gradle'))

// #   install: ->
// #     return if @gradleNotInstalled
// #     done = @async()

// #     gradlewCommand = "./gradlew#{if @_isWindows() then '.bat' else ''}"

// #     @log chalk.gray "  Executing 'gradle wrapper' command..."
// #     @spawnCommand('gradle', ['wrapper'], {stdio: 'ignore'}).on 'exit', =>
// #       @log.ok chalk.green "Done executing 'gradle wrapper' command."

// #       gradleTasks = ['build']
// #       gradleTasks.unshift('idea') if @props.ideaPlugin

// #       @log chalk.gray "  Executing Gradle tasks: #{gradleTasks.join(' ')}"
// #       @spawnCommand(gradlewCommand, gradleTasks, {stdio: 'ignore'}).on 'exit', =>
// #         @log.ok chalk.green "Done executing Gradle tasks: #{gradleTasks.join(' ')}"
// #         done()

// #   _isWindows: ->
// #     os.platform().toLowerCase().startsWith('win')

// #   _getProjectName: ->
// #     @prompts.projectName.default = @appname

class GradleKotlinGenerator extends YeomanGenerator {
  constructor(args, options, config) {
    super(args, options, config);

    this.prompts = {
      gradleVersion: {
        name: 'gradleVersion',
        message: 'Which Gradle version does your project use?'
      },
      kotlinVersion: {
        name: 'kotlinVersion',
        message: 'Which Kotlin version does your project use?'
      }
    }
  }

  /*
    Default priorities according to the [Yeoman Docs](http://yeoman.io/authoring/running-context.html):
    initializing - Your initialization methods (checking current project state, getting configs, etc)
    prompting - Where you prompt users for options (where you'd call this.prompt())
    configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
    default - If the method name doesn't match a priority, it will be pushed to this group.
    writing - Where you write the generator specific files (routes, controllers, etc)
    conflicts - Where conflicts are handled (used internally)
    install - Where installation are run (npm, bower)
    end - Called last, cleanup, say good bye, etc
   */

  initializing() {
    console.log('Initializing Step');
    return Promise.all([this._fetchGradleVersion(), this._fetchKotlinVersion()]);
  }

  /**
   * Checks and fetches the version of the locally installed Gradle instance
   * @returns {PromiseLike} a promise
   */
  _fetchGradleVersion() {
    console.log(chalk.gray('Checking the Gradle version installed on your system'));
    return exec('gradle --version').then(response => {
      let gradleVersion = response.match(/^Gradle (\d+\.\d+)$/m)[1];
      console.log(chalk.green(`Detected installed Gradle version: ${gradleVersion}`));
      return Promise.resolve(gradleVersion);
    }).catch(error => {
      console.error(`An error occured while detecting the Gradle version. Defaulting to ${DEFAULT_GRADLE_VERSION}`);
      return Promise.resolve(DEFAULT_GRADLE_VERSION);
    }).then(gradleVersion => {
      this.prompts.gradleVersion.default = gradleVersion;
    })
  }

  /**
   * Checks Maven Central for the latest Kotlin version. Defaults to the one specified by DEFAULT_KOTLIN_VERSION
   * @returns {PromiseLike} a promise
   */
  _fetchKotlinVersion() {
    console.log(chalk.gray('Fetching the latest Kotlin version form Maven Central'));

    return request(MVNCNTRL_KOTLIN_SEARCH)
      .then(response => {
        let kotlinVersion = JSON.parse(response.body).response.docs[0].latestVersion;
        console.log(chalk.green('Found latest Kotlin version: ' + kotlinVersion));
        return Promise.resolve(kotlinVersion);
      }).catch(error => {
        console.log(chalk.green('An error occured while fetching the latest Kotling version! Defaulting to: : ' + DEFAULT_KOTLIN_VERSION));
        return Promise.resolve(DEFAULT_KOTLIN_VERSION);
      }).then(kotlinVersion => {
        this.prompts.kotlinVersion.default = kotlinVersion;
      });
  }

  prompting() {
    console.log('Prompting Step');
    return this.prompt(Object.values(this.prompts))
      .then(props => { this.props = props; });
  }

  writing() {
    console.log('Writing Step');
    
    let context = { props: this.props };

    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
    this.fs.copy(this.templatePath('gitkeep'), this.destinationPath('src/main/kotlin/.gitkeep'));
    this.fs.copy(this.templatePath('gitkeep'), this.destinationPath('src/main/kotlin/.gitkeep'));
    this.fs.copyTpl(this.templatePath('build.gradle.ejs'), this.destinationPath('build.gradle'), context);
    this.fs.copyTpl(this.templatePath('gradle.properties.ejs'), this.destinationPath('gradle.properties'), context);
    this.fs.copyTpl(this.templatePath('settings.gradle.ejs'), this.destinationPath('settings.gradle'), context);
  }

  end() {
    console.log('End Step');
  }
}

module.exports = GradleKotlinGenerator
