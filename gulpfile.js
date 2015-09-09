var gulp        = require('gulp');
var del         = require('del');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var bower       = require('gulp-bower');
var runSequence = require('run-sequence');
var jshint      = require('gulp-jshint');
var stylish     = require('jshint-stylish');
var wiredep     = require('wiredep').stream;

var dist = './_site';
var srcJavascripts = './js'; 
var distCSS = './_site/css';
var distJavascripts = './_site/js';
var pkg = require('./package.json');

var messages = {
    jekyllBuild: '<span style="color: gray">Running:</span> $ jekyll build'
};

/**
 * Install bower
 */
gulp.task('bower', function() {
  return bower();
});

gulp.task('wiredep', function () {
    return gulp.src('./_layouts/default.html')
        .pipe(wiredep({
                directory: './bower_components',
                bowerJson: require('./bower.json'),
                ignorePath: '..',
                //exclude: "www/lib/angular/angular.js"
            }))
        .pipe(gulp.dest('./_layouts'));
});

/**
 * Delete CSS JS files
 */
gulp.task('delete', function() {
    del([ dist + '/js', dist + '/css']).then(function(){
        console.log(del.sync);
    });
});

/**
 * Check JS files
 */
gulp.task('lint', function() {
    return gulp.src(srcJavascripts + '/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll, compile sass e js, do page reload
 */
gulp.task('jekyll-rebuild', function (callback) {
    runSequence('jekyll-build',
        ['sass', 'js'],
        callback);
    browserSync.reload();
});

/**
 * Launch the Server
 */
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: '_site',
        }
    });
});

gulp.task('js', ['lint'], function () {
    return gulp.src([ srcJavascripts + '/*.js'])
        .pipe(concat('all.js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify()) 
        .pipe(gulp.dest(distJavascripts))
        //.pipe(del([distJavascripts + '/*.js']))
        .pipe(browserSync.reload({stream:true }));
        //.pipe(notify({ message: 'Script task complete' }));
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }).on('error', function(){ console.log(sass.logError) }))s
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest(distCSS))
        .pipe(browserSync.reload({stream:true}));
        //.pipe(gulp.dest('css'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch('js/*.js', ['js']);
    gulp.watch(['index.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just "gulp" will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */

gulp.task('default', function(callback) {
    runSequence('delete',
        'bower',
        'wiredep',
        'jekyll-build',
        ['sass', 'js'],
        'browser-sync',
        'watch',
        callback);
});

/**
 * Build app from scratch: compile jekyll, sass and JS
 */
gulp.task('build', function(callback) {
    runSequence('bower',
        'wiredep',
        'jekyll-build',
        ['sass', 'js'],
        callback);
});