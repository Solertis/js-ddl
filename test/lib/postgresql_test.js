var _ = require("underscore")
var Pg = require("pg")
var ddl = require("../..").postgresql

var db = new Pg.Client({host: "/tmp", database: "ddl_test"})
before(db.connect.bind(db))
after(db.end.bind(db))

describe("Ddl.postgresql", function() {
  beforeEach(function(done) { db.query("BEGIN", done) })
  afterEach(function(done) { db.query("ROLLBACK", done) })

  describe("given a simple table", function() {
    require("./_database_test").mustPassSimpleTable(withSql)
  })

  describe("type", function() {
    _({
      BIGINT: Number,
      BIGSERIAL: Number,
      BOOLEAN: Boolean,
      "CHARACTER VARYING": String,
      CHARACTER: String,
      DATE: Date,
      "DOUBLE PRECISION": Number,
      INTEGER: Number,
      NUMERIC: Number,
      REAL: Number,
      SMALLINT: Number,
      SMALLSERIAL: Number,
      SERIAL: Number,
      TEXT: String,
      TIME: Date,
      "TIME WITHOUT TIME ZONE": Date,
      TIMESTAMP: Date,
      "TIMESTAMP WITHOUT TIME ZONE": Date
    }).each(function(klass, type) {
      describe("given " + type, function() {
        withSql('CREATE TABLE "test" ("foo" ' + type + ')')

        it("must be set to " + klass.name, function() {
          this.ddl.foo.type.must.equal(klass)
        })
      })
    })

    describe("given differently cased type", function() {
      withSql('CREATE TABLE "test" ("foo" Date)')

      it("must be set properly", function() {
        this.ddl.foo.type.must.equal(Date)
      })
    })
  })

  describe("default", function() {
    require("./_database_test").mustPassDefault(withSql)

    describe("given autoincrement", function() {
      withSql('CREATE TABLE "test" ("foo" SERIAL)')

      it("must be set to undefined", function() {
        this.ddl.foo.must.have.property("default", undefined)
      })
    })

    describe("of TEXT column", function() {
      require("./_database_test").mustPassTextDefault(withSql)

      describe("given 'unknown'::character varying", function() {
        withSql('CREATE TABLE "test" ' +
          '("foo" CHARACTER VARYING(255) ' +
          'DEFAULT \'unknown\'::character varying' + 
          ')')

        it("must be set to \"unknown\"", function() {
          this.ddl.foo.must.have.property("default", "unknown")
        })
      })
    })

    describe("of REAL column", function() {
      require("./_database_test").mustPassRealDefault(withSql)
    })

    describe("of BOOLEAN column", function() {
      require("./_database_test").mustPassBooleanDefault(withSql)

      describe("given 1::boolean", function() {
        withSql('CREATE TABLE "test" ("foo" BOOLEAN DEFAULT 1::boolean)')

        it("must be set to true", function() {
          this.ddl.foo.must.have.property("default", true)
        })
      })

      describe("given 't'::boolean", function() {
        withSql('CREATE TABLE "test" ("foo" BOOLEAN DEFAULT \'t\'::boolean)')

        it("must be set to true", function() {
          this.ddl.foo.must.have.property("default", true)
        })
      })

      describe("given 0::boolean", function() {
        withSql('CREATE TABLE "test" ("foo" BOOLEAN DEFAULT 0::boolean)')

        it("must be set to false", function() {
          this.ddl.foo.must.have.property("default", false)
        })
      })

      describe("given 'f'::boolean", function() {
        withSql('CREATE TABLE "test" ("foo" BOOLEAN DEFAULT \'f\'::boolean)')

        it("must be set to false", function() {
          this.ddl.foo.must.have.property("default", false)
        })
      })

      describe("given 42::boolean", function() {
        withSql('CREATE TABLE "test" ("foo" BOOLEAN DEFAULT 42::boolean)')

        it("must be set to undefined", function() {
          this.ddl.foo.must.have.property("default", undefined)
        })
      })
    })

    describe("of INTERVAL column", function() {
      describe("given '00:00:00'::interval", function() {
        withSql(
          'CREATE TABLE "test" ("foo" INTERVAL DEFAULT \'00:00:00\'::interval)'
        )

        it("must be set to \"00:00:00\"", function() {
          this.ddl.foo.must.have.property("default", "00:00:00")
        })
      })
    })
  })

  function withSql(sql, fn) {
    beforeEach(function(done) { db.query(sql, done) })
    beforeEach(withAttrs(function(ddl) { this.ddl = ddl }))
  }

  function withAttrs(fn) {
    return function(done) {
      var self = this
      ddl(db, "test", function(err, ddl) {
        if (err) return done(err)
        fn.call(self, ddl)
        done()
      })
    }
  }
})