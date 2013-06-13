/**
 * Created with JetBrains WebStorm.
 * User: Tianyi(99)
 * Date: 13-3-20
 * Time: 下午5:52
 */
var mysql = require('mysql');


function mysqlOrm(conn) {
    this.conn = conn || {
        host:'192.168.1.186',
	database:'dj',
        user:'dj',
        password:'djabc123'
    };
    this.cache = {};
    this.connection = null;
}
function handleError (err) {
    if (err) {
        // 如果是连接断开，自动重新连
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connect();
        } else {
            console.error(err.stack || err);
        }
    }
}
mysqlOrm.prototype = {
    init:function () {
        var connect = mysql.createConnection(this.conn);
        connect.connect(this.handleError)
        this.connection = connect;
        connect.on('error', this.handleError);
        return connect
    },
    end:function () {
        if (this.connection) {
            this.connection.end();
            this.connection = null;
        } else {
            throw new Error('no mySql connection exists')
        }

    },
    handleError:function (err) {
    if (err) {
        // 如果是连接断开，自动重新连
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            this.connection.connect();
        } else {
            console.error(err.stack || err);
        }
    }
},
    exec:function (statement, callback) {
        if (this.connection) {
            this.connection.query(statement, function (err, rows, fields) {
                if (err) throw err;
                callback(rows, fields)
            });
        } else {
            throw new Error('no mySql connection exists')
        }
    }
}
exports.orm = mysqlOrm;