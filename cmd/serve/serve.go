package serve

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"log"
	"skymeet/server"
	"time"
)

func NewServeCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Serve webrtc and video server",
		Long:  "Serve webrtc and video server",
		Run:   runServe,
	}

	return cmd
}

func runServe(cmd *cobra.Command, args []string) {
	HubCtl := server.NewHub()
	exit := make(chan struct{})
	HubCtl.Run(exit)

	router := gin.New()
	corsMiddleware := cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"PUT", "PATCH", "GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "x-access-token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		MaxAge: 12 * time.Hour,
	})

	router.Use(corsMiddleware)
	router.Use(gin.Recovery())

	router.Static("/static", "client/")
	router.LoadHTMLGlob("client/templates/*")
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"code": "Not found", "message": "Page not found"})
	})

	router.GET("/", server.Welcome)
	router.POST("/", server.Room)
	router.GET("/room", server.RoomHandler)
	router.POST("/room", server.RoomHandler)
	router.GET("/ws", HubCtl.WebsocketHandler)

	err := router.Run("0.0.0.0:8080")
	if err != nil {
		log.Fatal(err)
	}
}
