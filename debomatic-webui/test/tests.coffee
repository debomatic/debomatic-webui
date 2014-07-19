fs = require('fs')
path = require('path')
spawn = require('child_process').spawn
exec = require('child_process').exec

config = require('./tests.config')
io = require('socket.io-client')
events = require('../lib/config').events
should = require('should')

server = null

launch_server = () ->
    server = spawn('coffee', ['../debomatic-webui.coffee', '-c', 'test/tests.config.coffee'])
    server.stdout.on 'data', (data) -> console.log('\nSERVER OUT: ', data.toString('utf-8'))
    server.stderr.on 'data', (data) -> console.error('\nSERVER ERR', data.toString('utf-8'))
    server.on 'exit', (code) ->
        console.error('child process exited with code ' + code);
        process.exit(code)


class Helper
    constructor: ->
        @base = config.debomatic.path
        @json = config.debomatic.json

    make_distribution: (distribution) ->
        dpath = path.join(@base, distribution, 'pool')
        exec("mkdir -p #{dpath}")

    make_package: (distribution, debpack) ->
        dpath = path.join(@base, distribution, 'pool', debpack)
        exec("mkdir -p #{dpath}")

    make_file: (distribution, debpack, extension, data) ->
        file_path = path.join(@base, distribution, 'pool', debpack, debpack) + '.' + extension
        @make_package(distribution, debpack)
        exec("echo #{data} > #{file_path}")

    append_file: (distribution, debpack, extension, data) ->
        file_path = path.join(@base, distribution, 'pool', debpack, debpack) + '.' + extension
        @make_package(distribution, debpack)
        exec("echo #{data} >> #{file_path}")

    append_json: (data) ->
        exec("echo #{data} >> #{@json}")

    clean: (distribution, debpack, file_extension) ->
        b_path = @base
        b_path = path.join(b_path, distribution, 'pool') if distribution?
        b_path = path.join(@base, debpack) if debpack?
        b_path = path.join(@base, debpack) + '.' + file_extension if file_extension?
        exec("rm -r #{b_path}")

    clean_all: () ->
        exec("rm -r #{@base}/*")
        exec("rm -r #{@json}")

    get_query: (distribution, debpack, file_extension) ->
        result =
            distribution:
                name: distribution
        if debpack?
            result.package =
                orig_name: debpack
                name: debpack.split('_')[0]
                version: debpack.split('_')[1]

        if file_extension?
            result.file =
                name: file_extension

        return result



helper = new Helper()
helper.make_distribution('unstable')
# launch_server()
client = null
describe 'client', ->

    before( (done) ->
        helper.make_distribution('trusty')
        helper.make_distribution('unstable')
        helper.append_json("")
        client = io.connect("http://#{config.host}:#{config.port}")
        done()
    )

    it 'on connecting', (done) ->
        client.on 'connect', () ->
            client.on events.broadcast.distributions, (data) ->
                data.should.be.eql(['trusty', 'unstable'])
                client.on events.broadcast.status_debomatic, (data) ->
                    data.running.should.be.false
                    done()

    it 'on getting distribution packages', (done) ->
        helper.make_package('unstable', 'test_1.2.3')
        helper.make_package('unstable', 'test_1.2.4')
        client.emit(events.client.distribution_packages, helper.get_query('unstable'))
        client.on events.client.distribution_packages, (data) ->
            data.distribution.name.should.be.eql('unstable')
            packages_name = []
            for p in data.distribution.packages
                packages_name.push(p.orig_name)
            packages_name.should.be.eql(['test_1.2.3', 'test_1.2.4'])
            done()

    it 'on getting package list', (done) ->
        helper.make_file('unstable', 'test_1.2.3', 'buildlog', 'test')
        helper.make_file('unstable', 'test_1.2.3', 'lintian', 'test')
        client.emit(events.client.package_files_list, helper.get_query('unstable', 'test_1.2.3'))
        client.on events.client.package_files_list, (data) ->
            data.distribution.name.should.be.eql('unstable')
            data.package.orig_name.should.be.eql('test_1.2.3')
            files_name = []
            for f in data.package.files
                files_name.push(f.name)
            files_name.should.be.eql(['buildlog', 'lintian'])
            done()

    it 'on getting file', (done) ->
        helper.make_file('unstable', 'test_1.2.3', 'buildlog', 'this is a test')
        client.emit(events.client.file, helper.get_query('unstable', 'test_1.2.3', 'buildlog'))
        client.on events.client.file, (data) ->
            data.distribution.name.should.be.eql('unstable')
            data.package.orig_name.should.be.eql('test_1.2.3')
            data.file.name.should.be.eql('buildlog')
            data.file.content.should.be.eql('this is a test\n')
            done()

    it 'on getting file new content', (done) ->
        client.on events.client.file_newcontent, (data) ->
            data.distribution.name.should.be.eql('unstable')
            data.package.orig_name.should.be.eql('test_1.2.3')
            data.file.name.should.be.eql('buildlog')
            data.file.new_content.should.be.eql('this is an appending test\n')
            done()
        helper.append_file('unstable', 'test_1.2.3', 'buildlog', 'this is an appending test')

    after( (done) ->
        helper.clean_all()
        done()
    )

# process.on 'exit', () ->
#     server.kill()
