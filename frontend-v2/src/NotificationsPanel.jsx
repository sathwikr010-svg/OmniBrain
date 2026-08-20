import {
  CheckCircle2,
  AlertTriangle,
  X,
  Bell,
  Activity,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const API_URL = "http://127.0.0.1:8000";

function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          if (!cancelled) {
            setLoading(false);
          }

          return;
        }

        const response =
          await fetch(
            `${API_URL}/notifications/`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        // ======================================================
        // AUTHENTICATION
        // ======================================================

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "user_email"
          );

          window.location.href = "/";

          return;
        }


        // ======================================================
        // RESPONSE
        // ======================================================

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }


        // ======================================================
        // BACKEND ERROR
        // ======================================================

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.message ||
              "Unable to load notifications."
          );
        }


        // ======================================================
        // GET NOTIFICATIONS
        // ======================================================

        const backendNotifications =
          Array.isArray(
            data?.notifications
          )
            ? data.notifications
            : [];


        // ======================================================
        // CONVERT BACKEND DATA
        // INTO FRONTEND DATA
        // ======================================================

        const formattedNotifications =
          backendNotifications.map(
            (item, index) => {

              let icon =
                CheckCircle2;

              let type =
                item?.type ||
                "success";


              // ------------------------------------------------
              // WARNING
              // ------------------------------------------------

              if (
                type ===
                "warning"
              ) {
                icon =
                  AlertTriangle;
              }


              // ------------------------------------------------
              // INFO
              // ------------------------------------------------

              else if (
                type ===
                "info"
              ) {
                icon =
                  Activity;
              }


              // ------------------------------------------------
              // SUCCESS
              // ------------------------------------------------

              else if (
                type ===
                "success"
              ) {
                icon =
                  CheckCircle2;
              }


              // ------------------------------------------------
              // HEALTH / SECURITY
              // ------------------------------------------------

              if (
                String(
                  item?.title ||
                    ""
                )
                  .toLowerCase()
                  .includes(
                    "health"
                  )
              ) {
                icon =
                  type ===
                  "warning"
                    ? AlertTriangle
                    : ShieldCheck;
              }


              return {
                id:
                  item?.id ||
                  `notification-${index}`,

                title:
                  item?.title ||
                  "Notification",

                text:
                  item?.text ||
                  "No additional information available.",

                type,

                icon,

                read:
                  item?.read ??
                  false,

                created_at:
                  item?.created_at ||
                  null,
              };
            }
          );


        if (!cancelled) {
          setNotifications(
            formattedNotifications
          );
        }

      } catch (err) {

        console.error(
          "Notification loading error:",
          err
        );

        if (!cancelled) {

          setError(
            err?.message ||
              "Unable to retrieve notifications."
          );

          setNotifications([]);
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    };


    loadNotifications();


    return () => {
      cancelled = true;
    };

  }, []);


  // ============================================================
  // ICON COLOR
  // ============================================================

  const getIconColor = (
    type
  ) => {

    if (
      type ===
      "warning"
    ) {
      return "#ef8b3d";
    }

    if (
      type ===
      "info"
    ) {
      return "#2879df";
    }

    return "#20a77d";
  };


  // ============================================================
  // MARK NOTIFICATION AS READ
  // ============================================================

  const markAsRead = async (
    notification
  ) => {

    if (
      !notification?.id
    ) {
      return;
    }

    try {

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        return;
      }


      await fetch(
        `${API_URL}/notifications/${encodeURIComponent(
          notification.id
        )}/read`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );


      setNotifications(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    read: true,
                  }
                : item
          )
      );

    } catch (err) {

      console.error(
        "Unable to mark notification as read:",
        err
      );

    }
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          100,
      }}

      onClick={
        onClose
      }
    >

      <div
        style={{
          position:
            "absolute",

          right:
            "30px",

          top:
            "70px",

          width:
            "370px",

          maxWidth:
            "calc(100vw - 40px)",

          maxHeight:
            "calc(100vh - 100px)",

          overflowY:
            "auto",

          background:
            "#fff",

          border:
            "1px solid #e5eaf1",

          borderRadius:
            "14px",

          boxShadow:
            "0 15px 50px rgba(15,23,42,.15)",

          padding:
            "18px",
        }}

        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",
          }}
        >

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",
            }}
          >

            <Bell
              size={17}
              color="#2879df"
            />

            <h2
              style={{
                margin:
                  0,

                fontSize:
                  "16px",

                color:
                  "#17243c",
              }}
            >
              Notifications
            </h2>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            style={{
              border:
                0,

              background:
                "transparent",

              cursor:
                "pointer",

              color:
                "#657286",
            }}
          >

            <X
              size={17}
            />

          </button>

        </div>


        {/* ==================================================
            CONTENT
        ================================================== */}

        <div
          style={{
            marginTop:
              "12px",
          }}
        >

          {/* LOADING */}

          {loading && (

            <div
              style={{
                padding:
                  "35px 10px",

                textAlign:
                  "center",

                color:
                  "#8994a6",

                fontSize:
                  "11px",
              }}
            >
              Loading latest
              notifications...
            </div>

          )}


          {/* ERROR */}

          {!loading &&
            error && (

            <div
              style={{
                padding:
                  "18px 10px",

                textAlign:
                  "center",

                color:
                  "#c62828",

                fontSize:
                  "11px",

                lineHeight:
                  "1.5",
              }}
            >

              <AlertTriangle
                size={24}
                style={{
                  marginBottom:
                    "7px",
                }}
              />

              <div>
                {error}
              </div>

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            notifications.length ===
              0 && (

            <div
              style={{
                padding:
                  "35px 10px",

                textAlign:
                  "center",

                color:
                  "#8994a6",

                fontSize:
                  "11px",
              }}
            >

              <Bell
                size={25}
                style={{
                  marginBottom:
                    "8px",

                  opacity:
                    0.5,
                }}
              />

              <div>
                No notifications
                available.
              </div>

            </div>

          )}


          {/* NOTIFICATIONS */}

          {!loading &&
            !error &&
            notifications.length >
              0 && (

            notifications.map(
              (
                item,
                index
              ) => {

                const Icon =
                  item.icon;

                return (

                  <button
                    key={
                      item.id ||
                      `${item.title}-${index}`
                    }

                    type="button"

                    onClick={() =>
                      markAsRead(
                        item
                      )
                    }

                    style={{
                      width:
                        "100%",

                      display:
                        "flex",

                      gap:
                        "12px",

                      padding:
                        "14px 0",

                      border:
                        "none",

                      borderBottom:
                        index ===
                        notifications.length -
                          1
                          ? "none"
                          : "1px solid #f0f2f5",

                      background:
                        item.read
                          ? "#ffffff"
                          : "#fafcff",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",
                    }}
                  >

                    {/* ICON */}

                    <div
                      style={{
                        width:
                          "34px",

                        height:
                          "34px",

                        borderRadius:
                          "8px",

                        background:
                          "#f5f8fc",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        flexShrink:
                          0,
                      }}
                    >

                      <Icon
                        size={18}
                        color={getIconColor(
                          item.type
                        )}
                      />

                    </div>


                    {/* TEXT */}

                    <div
                      style={{
                        minWidth:
                          0,

                        flex:
                          1,
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap:
                            "8px",
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",

                            fontSize:
                              "12px",

                            color:
                              "#263249",
                          }}
                        >
                          {
                            item.title
                          }
                        </strong>


                        {!item.read && (

                          <span
                            style={{
                              width:
                                "7px",

                              height:
                                "7px",

                              borderRadius:
                                "50%",

                              background:
                                "#2879df",

                              flexShrink:
                                0,
                            }}
                          />

                        )}

                      </div>


                      <span
                        style={{
                          display:
                            "block",

                          color:
                            "#8994a6",

                          fontSize:
                            "10px",

                          lineHeight:
                            "1.5",

                          marginTop:
                            "4px",
                        }}
                      >
                        {
                          item.text
                        }
                      </span>

                    </div>

                  </button>

                );
              }
            )

          )}

        </div>

      </div>

    </div>
  );
}

export default NotificationPanel;