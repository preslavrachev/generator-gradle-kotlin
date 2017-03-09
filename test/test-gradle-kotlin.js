'use strict'

let fs = require('fs-extra');

let Generator = require(path.join(__dirname, '../generators/app'));

describe('gradle-kotlin:app', () => {

  before(() => {
    return helpers.run(Generator)
    .inTmpDir(dir => {
      console.log(`Test Setup: Copying templates to ${dir}`)
      fs.copySync(path.join(__dirname, '../generators/app/templates/'), path.join(dir, 'templates'));
    })
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

