const { Server } = require("socket.io");
const { createServer } = require("http");
const events = require("events");
const { scheduleTask } = require("./helpers");
const { randomBytes } = require("crypto");
const { getAnalyticsReport } = require("./context");

module.exports = (app) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
    },
    // path: "/socketio-client/saat-vote",
  });
  app.set("event", new events.EventEmitter());

  io.on("connection", (socket) => {
    console.log("socket connected...", socket.connected);
    const clearState = (eventName) => {
      if (!eventName || eventName === "topSearchedReport") {
        socket.removeAllListeners("reportTopSearched");
        app.set(`${socket.id}-topSearchedReport-options`, null);
        if (app.get(`${socket.id}-topSearchedReportTask`)) {
          console.log("stopedd task topReport...");
          app.get(`${socket.id}-topSearchedReportTask`).stop();
          app.set(`${socket.id}-topSearchedReportTask`, null);
        }
      }
      if (!eventName || eventName === "trendingReport") {
        socket.removeAllListeners("reportTrending");
        app.set(`${socket.id}-trendingReport-options`, null);
        if (app.get(`${socket.id}-trendingReportTask`)) {
          console.log("stopedd task trendingReport...");
          app.get(`${socket.id}-trendingReportTask`).stop();
          app.set(`${socket.id}-trendingReportTask`, null);
        }
      }
    };
    const reportAnalytics = (report, eventName = "topSearchedReport", jwt) => {
      try {
        // console.log(app.get(`${socket.id}-${eventName}Task`));
        !app.get(`${socket.id}-${eventName}Task`) &&
          scheduleTask("", "", async (task) => {
            try {
              const options =
                app.get(`${socket.id}-${eventName}-options`) || {};
              // console.log(options, "options...");
              if (options?.category && typeof options.category !== "string") {
                clearState(eventName);
                return socket.emit(eventName, {
                  message: `Expected options.category to be string, got ${typeof options?.category}`,
                });
              }
              app.set(`${socket.id}-${eventName}Task`, task);
              const f = await getAnalyticsReport({
                report,
                category: options?.category,
                req: options.userId,
                rawDoc: true,
              });
              f.__typename = "analyticsReport";
              socket.volatile.emit(eventName, undefined, f);
            } catch (err) {
              console.log("errr ", err.message);
              socket.volatile.emit(eventName, {
                message: err.message,
                name: err.name,
              });
            }
          });
      } catch (err) {
        socket.volatile.emit(eventName, err);
      }
    };
    socket.on("reportTopSearched", (options) => {
      app.set(`${socket.id}-topSearchedReport-options`, options);
      reportAnalytics(
        "topSearchedSongs topSearchedAlbums topSearchedPlaylists topSearchedArtists",
        "topSearchedReport"
      );
    });
    socket.on("reportTrending", (options) => {
      app.set(`${socket.id}-trendingReport-options`, options);
      reportAnalytics(
        "trendingSongs trendingAlbums trendingPlaylists trendingArtists trendingRadios",
        "trendingReport"
      );
    });

    socket.on("disconnect", (a) => {
      console.log("dsiconnected socket... ", a);
      clearState();
    });
  });
  httpServer.listen(8080, () => console.log("runnig"));
};
