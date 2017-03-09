'use strict'

let path = require('path')
let helpers = require('yeoman-test')
let assert = require('yeoman-assert')
let os = require('os')

describe('gradle-kotlin:app', () => {

  before(() => {
    return helpers.run(path.join(__dirname, '../generators/app'))
    .withOptions({
      skipInstall: true
    }).withPrompts({
      gradleVersion: '2.7',
      kotlinVersion: '1.1.0'
    });
    });
  });

  it('creates Gradle files', () => {
    assert.file([
      'build.gradle',
      'build.gradle',
      'gradle.properties'
    ]);
  });

  it('creates \'src\' and the subdirs', () => {
    assert.file([
      'src/main/kotlin/.gitkeep',
      'src/test/kotlin/.gitkeep'
    ]);
  });
});

