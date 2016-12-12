var gulp        = require('gulp');
var del         = require('del');
var browserSync = require('browser-sync');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var bourbon     = require('bourbon').includePaths;
var neat        = require('bourbon-neat').includePaths;
var runSequence = require('run-sequence');
var jshint      = require('gulp-jshint');
var stylish     = require('jshint-stylish');

var dist = './_site';
var srcJavascripts = './_js'; 
var distCSS = './_site/css';
var distJavascripts = './_site/js';
var pkg = require('./package.json');

var messages = {
    jekyllBuild: '<span style="color: gray">Running:</span> $ jekyll build'
};


gulp.task('browserify', function () {
  return browserify({
    entries: ['./_js/main.js'],
    extensions: ['.js']
  })
  .bundle()
  // Pass desired output filename to vinyl-source-stream
  .pipe(source('bundle.js'))
  // Start piping stream to tasks!
  .pipe(buffer())
  .pipe(uglify({
    mangle: false,
    output: {
      beautify: false
    }
  }))
  // .pipe(gulp.dest('./.tmp/'))
  .pipe(gulp.dest(distJavascripts))
})

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
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'}).on('close', done);
});

/**
 * Rebuild Jekyll, compile sass e js, do page reload
 */
gulp.task('jekyll-rebuild', function (callback) {
    runSequence('jekyll-build',
        ['sass', 'browserify'],
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

// gulp.task('js', ['lint'], function () {
//     return gulp.src([ srcJavascripts + '/*.js'])
//         .pipe(concat('main.js'))
//         .pipe(rename('main.min.js'))
//         .pipe(uglify()) 
//         .pipe(gulp.dest(distJavascripts))
//         //.pipe(del([distJavascripts + '/*.js']))
//         .pipe(browserSync.reload({stream:true }));
//         //.pipe(notify({ message: 'Script task complete' }));
// });

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'].concat(bourbon, neat),
            onError: browserSync.notify
        }).on('error', function(){ console.log(sass.logError) }))
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
    gulp.watch(['_scss/*.scss', '_scss/modules/*.scss'], ['sass']);
    gulp.watch('_js/*.js', ['browserify']);
    gulp.watch(['index.html', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just "gulp" will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */

gulp.task('default', function(callback) {
    runSequence('delete',
        'jekyll-build',
        ['sass', 'browserify'],
        'browser-sync',
        'watch',
        callback);
});

/**
 * Build app from scratch: compile jekyll, sass and JS
 */
gulp.task('build', function(callback) {
    runSequence('jekyll-build',
        ['sass', 'browserify'],
        callback);
});