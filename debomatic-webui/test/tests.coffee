fs = require('fs')
path = require('path')
spawn = require('child_process').spawn
sh = require('execSync')

config = require('./tests.config')
io = require('socket.io-client')
events = require('../lib/config').events
should = require('should')

server = null

exec = (c) ->
    c = c.replace('"', '\"')
    sh.run("echo '#{c}' >> commands.log")
    sh.run(c)


class Helper
    constructor: ->
        @base = config.debomatic.path
        @json = config.debomatic.jsonfile

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
        exec("echo '#{data}' >> #{file_path}")

    append_json: (data) ->
        exec("echo '#{data}' >> #{@json}")

    clean: (distribution, debpack, file_extension) ->
        b_path = @base
        b_path = path.join(b_path, distribution, 'pool') if distribution?
        b_path = path.join(b_path, debpack) if debpack?
        b_path += path.join(b_path, debpack) + '.' + file_extension if file_extension?
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
client = null
server = null

options =
    transports: ['websocket'],
    'force new connection': true

describe 'start server', ->
    before( (done) =>
        helper.append_json('')
        helper.make_distribution('trusty')
        helper.make_distribution('unstable')
        server = spawn('coffee', ['../debomatic-webui', '-c', 'tests.config.coffee'])
        server.stdout.on 'data', (data) -> console.log('SERVER OUT: ', data.toString('utf-8'))
        server.stderr.on 'data', (data) -> console.error('SERVER ERR', data.toString('utf-8'))
        server.on 'exit', (code) ->
            console.error('Server exit with code ' + code)
            process.exit(code)
        this.timeout(7000)
        setTimeout(done, 500)
    )

    it 'server started', (done) ->
        server.should.be.ok
        done()

describe 'client', ->

    before( (done) ->
        helper.append_json('{"status": "build", "package": "test_1.2.3", "distribution": "unstable"}')
        #launch_server() if process.env.SERVER
        done()
    )

    beforeEach( (done) ->
        client = io.connect("http://#{config.host}:#{config.port}", options)
        client.once 'connect', ->
            done()
    )

    afterEach( (done) ->
        client.disconnect()
        done()
    )

    it 'get distributions', (done) ->
        client.once events.broadcast.distributions, (data) ->
            data.should.be.eql(['trusty', 'unstable'])
            done()

    it 'get debomatic status', (done) ->
        client.once events.broadcast.status_debomatic, (data) ->
            data.running.should.be.false
            done()

    it 'get package status', (done) ->
        client.once events.client.status, (data) ->
            data = data[0]
            data.status.should.be.eql('build')
            data.distribution.should.be.eql('unstable')
            data.package.should.be.eql('test_1.2.3')
            done()

    it 'on getting distribution packages', (done) ->
        helper.make_package('unstable', 'test_1.2.3')
        helper.make_package('unstable', 'test_1.2.4')
        client.emit(events.client.distribution_packages, helper.get_query('unstable'))
        client.once events.client.distribution_packages, (data) ->
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
        client.once events.client.package_files_list, (data) ->
            data.distribution.name.should.be.eql('unstable')
            data.package.orig_name.should.be.eql('test_1.2.3')
            files_name = []
            for f in data.package.files
                files_name.push(f.name)
            files_name.should.be.eql(['buildlog', 'lintian'])
            done()

    describe 'on getting file', ->
        it 'full content', (done) ->
            helper.make_file('unstable', 'test_1.2.3', 'buildlog', 'this is a test')
            client.emit(events.client.file, helper.get_query('unstable', 'test_1.2.3', 'buildlog'))
            client.once events.client.file, (data) ->
                data.distribution.name.should.be.eql('unstable')
                data.package.orig_name.should.be.eql('test_1.2.3')
                data.file.name.should.be.eql('buildlog')
                data.file.content.should.be.eql('this is a test\n')
            done()

        it 'new content', (done) ->
            client.once events.client.file_newcontent, (data) ->
                data.distribution.name.should.be.eql('unstable')
                data.package.orig_name.should.be.eql('test_1.2.3')
                data.file.name.should.be.eql('buildlog')
                data.file.new_content.should.be.eql('this is an appending test\n')
                done()
            client.emit(events.client.file, helper.get_query('unstable', 'test_1.2.3', 'buildlog'))
            helper.append_file('unstable', 'test_1.2.3', 'buildlog', 'this is an appending test')

    describe 'on build package ends', ->
        it 'should receive a status update', (done) ->
            client.once events.broadcast.status_update, (data) ->
                data.success.should.be.ok
                done()
            str = '{"status": "build", "success": true, "package": "test_1.2.3", "uploader": "", "distribution": "unstable"}'
            helper.append_json(str)

        it 'should no longer receive status of same package', (done) ->
            client1 = io.connect("http://#{config.host}:#{config.port}", options)
            client1.once events.client.status, (data) ->
                data.length.should.be.eql(1)
                data[0].package.should.be.eql('test_1.2.4')
                done()
            str = '{"status": "build", "package": "test_1.2.4", "distribution": "unstable"}'
            helper.append_json(str)

    describe 'should get error on removing', ->
        it 'package', (done) ->
            helper.make_file('unstable', 'test_1.2.5', 'buildlog', 'test on error')
            client.emit(events.client.file, helper.get_query('unstable', 'test_1.2.5', 'buildlog'))
            client.once events.error, (data) ->
                data.indexOf('buildlog').should.be.ok
                data.indexOf('test_1.2.5').should.be.ok
                data.indexOf('unstable').should.be.ok
                data.indexOf('deleted').should.be.ok
                done()
            helper.clean('unstable', 'test_1.2.5')


process.on 'exit', () ->
    client.disconnect()
    helper.clean_all()# if process.env.SERVER
    server.kill() if server?
