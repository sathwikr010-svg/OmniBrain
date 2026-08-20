import {
  Database,
  FileText,
  Search,
  Upload,
  BookOpen,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;


const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
];

/* ============================================================
   DOCUMENT NORMALIZER
   ============================================================ */

const normalizeDocument = (document, index = 0) => {
  const name =
    document?.name ||
    document?.filename ||
    document?.file_name ||
    document?.original_name ||
    `Document ${index + 1}`;

  const storedName =
    document?.stored_name ||
    document?.storedName ||
    document?.filename ||
    document?.file_name ||
    name;

  const type =
    document?.type ||
    document?.file_type ||
    document?.extension ||
    name.split(".").pop()?.toUpperCase() ||
    "FILE";

  const status =
    document?.status ||
    "Indexed";

  const chunks = Number(
    document?.chunks ??
      document?.chunk_count ??
      document?.indexed_chunks ??
      0
  );

  const size =
    document?.size ||
    document?.file_size ||
    "";

  const uploadedAt =
    document?.uploaded_at ||
    document?.created_at ||
    document?.createdAt ||
    "";

  return {
    ...document,

    id:
      document?.id ??
      storedName ??
      `document-${index}`,

    name,

    stored_name: storedName,

    type: String(type).toUpperCase(),

    status,

    chunks,

    size,

    uploaded_at: uploadedAt,
  };
};


/* ============================================================
   COMPONENT
   ============================================================ */

function Knowledge() {

  const fileInputRef = useRef(null);

  /* ============================================================
     STATE
     ============================================================ */

  const [search, setSearch] = useState("");

  const [documents, setDocuments] = useState([]);

  const [indexedChunks, setIndexedChunks] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deleting, setDeleting] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  /* ============================================================
     AUTH
     ============================================================ */

  const getToken = () => {
    return localStorage.getItem(
      "access_token"
    );
  };


  const handleUnauthorized = () => {

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user_email"
    );

    window.location.href = "/";
  };


  const getHeaders = () => {

    const token = getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization:
        `Bearer ${token}`,
    };
  };


  /* ============================================================
     LOAD KNOWLEDGE
     ============================================================ */

  const loadKnowledge = useCallback(
    async (manual = false) => {

      try {

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/knowledge/`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );


        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }


        /* AUTH */

        if (
          response.status === 401
        ) {
          handleUnauthorized();
          return;
        }


        /* ERROR */

        if (!response.ok) {

          throw new Error(
            data?.detail ||
              data?.message ||
              `Unable to load knowledge (${response.status}).`
          );

        }


        /* DOCUMENTS */

        const rawDocuments =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.documents
              )
            ? data.documents
            : Array.isArray(
                data?.items
              )
            ? data.items
            : [];


        const normalized =
          rawDocuments.map(
            normalizeDocument
          );


        setDocuments(
          normalized
        );


        /* CHUNKS */

        const backendChunks =
          Number(
            data?.indexed_chunks ??
              data?.total_chunks ??
              data?.chunks ??
              0
          );


        const calculatedChunks =
          normalized.reduce(
            (total, document) =>
              total +
              Number(
                document.chunks || 0
              ),
            0
          );


        setIndexedChunks(
          backendChunks ||
            calculatedChunks
        );

      } catch (err) {

        console.error(
          "Knowledge loading error:",
          err
        );

        setError(
          err?.message ||
            "Unable to connect to the knowledge service."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {

    loadKnowledge(false);

  }, [loadKnowledge]);


  /* ============================================================
     AUTO REFRESH
     ============================================================ */

  useEffect(() => {
  const getRefreshSettings = () => {
    try {
      const stored = localStorage.getItem(
        "omnibrain_settings"
      );

      if (!stored) {
        return {
          autoRefresh: true,
          refreshInterval: 30,
        };
      }

      const settings = JSON.parse(stored);

      return {
        autoRefresh:
          settings.autoRefresh ?? true,

        refreshInterval:
          Number(settings.refreshInterval) >= 5
            ? Number(settings.refreshInterval)
            : 30,
      };
    } catch {
      return {
        autoRefresh: true,
        refreshInterval: 30,
      };
    }
  };

  let interval;

  const startAutoRefresh = () => {
    if (interval) {
      clearInterval(interval);
    }

    const settings = getRefreshSettings();

    if (!settings.autoRefresh) {
      return;
    }

    interval = setInterval(() => {
      if (!uploading && !deleting) {
        loadKnowledge(false);
      }
    }, settings.refreshInterval * 1000);
  };

  startAutoRefresh();

  const handleSettingsChange = () => {
    startAutoRefresh();
  };

  window.addEventListener(
    "omnibrain-settings-changed",
    handleSettingsChange
  );

  return () => {
    if (interval) {
      clearInterval(interval);
    }

    window.removeEventListener(
      "omnibrain-settings-changed",
      handleSettingsChange
    );
  };
}, [
  loadKnowledge,
  uploading,
  deleting,
]);

  /* ============================================================
     OPEN FILE SELECTOR
     ============================================================ */

  const handleAddKnowledge =
    () => {

      if (uploading) {
        return;
      }

      setMessage("");
      setError("");

      fileInputRef.current?.click();

    };


  /* ============================================================
     UPLOAD DOCUMENT
     ============================================================ */

  const handleFileChange =
    async (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      setMessage("");
      setError("");


      /* EXTENSION */

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();


      if (
        !ALLOWED_EXTENSIONS.includes(
          extension
        )
      ) {

        setError(
          "Only PDF, DOCX and TXT files are supported."
        );

        event.target.value = "";

        return;
      }


      /* EMPTY FILE */

      if (file.size === 0) {

        setError(
          "The selected file is empty."
        );

        event.target.value = "";

        return;
      }


      setUploading(true);


      try {

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );


        const response =
          await fetch(
            `${API_BASE_URL}/knowledge/upload`,
            {
              method: "POST",
              headers:
                getHeaders(),
              body: formData,
            }
          );


        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }


        /* AUTH */

        if (
          response.status === 401
        ) {
          handleUnauthorized();
          return;
        }


        /* ERROR */

        if (!response.ok) {

          throw new Error(
            data?.detail ||
              data?.message ||
              "Document upload failed."
          );

        }


        /* SUCCESS */

        const uploadedName =
          data?.filename ||
          data?.name ||
          file.name;


        setMessage(
          `âœ“ ${uploadedName} uploaded and indexed successfully.`
        );


        await loadKnowledge(
          false
        );

      } catch (err) {

        console.error(
          "Knowledge upload error:",
          err
        );

        setError(
          err?.message ||
            "Unable to upload document."
        );

      } finally {

        setUploading(false);

        event.target.value = "";

      }

    };


  /* ============================================================
     DELETE DOCUMENT
     ============================================================ */

  const handleDelete =
    async (document) => {

      if (
        !document?.stored_name
      ) {

        setError(
          "This document cannot be deleted because its stored filename is missing."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${document.name}"?`
        );


      if (!confirmed) {
        return;
      }


      setMessage("");
      setError("");

      setDeleting(
        document.stored_name
      );


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/knowledge/${encodeURIComponent(
              document.stored_name
            )}`,
            {
              method: "DELETE",
              headers:
                getHeaders(),
            }
          );


        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }


        /* AUTH */

        if (
          response.status === 401
        ) {
          handleUnauthorized();
          return;
        }


        /* ERROR */

        if (!response.ok) {

          throw new Error(
            data?.detail ||
              data?.message ||
              "Document deletion failed."
          );

        }


        /* SUCCESS */

        setMessage(
          `âœ“ ${document.name} deleted successfully.`
        );


        await loadKnowledge(
          false
        );

      } catch (err) {

        console.error(
          "Knowledge deletion error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete document."
        );

      } finally {

        setDeleting(null);

      }

    };


  /* ============================================================
     FILTER DOCUMENTS
     ============================================================ */

  const filteredDocuments =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();


      if (!value) {
        return documents;
      }


      return documents.filter(
        (document) => {

          const searchable =
            [
              document.name,
              document.type,
              document.status,
              document.stored_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          return searchable.includes(
            value
          );

        }
      );

    }, [
      documents,
      search,
    ]);


  /* ============================================================
     TOTAL CHUNKS
     ============================================================ */

  const totalChunks =
    indexedChunks ||
    documents.reduce(
      (total, document) =>
        total +
        Number(
          document.chunks || 0
        ),
      0
    );


  /* ============================================================
     DOCUMENT TYPES
     ============================================================ */

  const pdfCount =
    documents.filter(
      (document) =>
        document.type === "PDF"
    ).length;


  const docxCount =
    documents.filter(
      (document) =>
        document.type === "DOCX"
    ).length;


  const txtCount =
    documents.filter(
      (document) =>
        document.type === "TXT"
    ).length;


  /* ============================================================
     CARD STYLE
     ============================================================ */

  const cardStyle = {

    background:
      "#ffffff",

    border:
      "1px solid #e7ecf2",

    borderRadius:
      "14px",

    padding:
      "22px",

    boxShadow:
      "0 4px 15px rgba(31,52,77,.035)",

  };


  /* ============================================================
     RENDER
     ============================================================ */

  return (

    <div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="ob-header"
      >

        <div>

          <div
            className="ob-breadcrumb"
          >

            <span>
              Workspace
            </span>

            <b>
              /
            </b>

            <strong>
              Knowledge
            </strong>

          </div>


          <h1>
            Knowledge Base
          </h1>


          <p>
            Manage information available
            to OmniBrain AI agents.
          </p>

        </div>


        <div
          style={{
            display:
              "flex",
            gap:
              "10px",
            alignItems:
              "center",
          }}
        >

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => {

              setMessage("");
              setError("");

              loadKnowledge(
                true
              );

            }}
            disabled={
              loading ||
              refreshing ||
              uploading
            }
            title="Refresh knowledge"
            style={{
              border:
                "1px solid #dfe5ed",

              background:
                "#ffffff",

              color:
                "#2879df",

              width:
                "40px",

              height:
                "40px",

              borderRadius:
                "9px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              cursor:
                loading ||
                refreshing ||
                uploading
                  ? "not-allowed"
                  : "pointer",
            }}
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "knowledge-spin"
                  : ""
              }
            />

          </button>


          {/* UPLOAD */}

          <button
            type="button"
            onClick={
              handleAddKnowledge
            }
            disabled={
              uploading
            }
            style={{
              border:
                "none",

              background:
                uploading
                  ? "#8eb9ed"
                  : "#1677df",

              color:
                "#ffffff",

              padding:
                "11px 16px",

              borderRadius:
                "9px",

              display:
                "flex",

              gap:
                "7px",

              alignItems:
                "center",

              cursor:
                uploading
                  ? "not-allowed"
                  : "pointer",

              fontWeight:
                600,
            }}
          >

            {uploading ? (

              <Loader2
                size={16}
                className="knowledge-spin"
              />

            ) : (

              <Upload
                size={16}
              />

            )}

            {uploading
              ? "Uploading..."
              : "Add Knowledge"}

          </button>


          {/* FILE INPUT */}

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={
              handleFileChange
            }
            style={{
              display:
                "none",
            }}
          />

        </div>

      </div>


      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {message && (

        <div
          style={{
            background:
              "#ecfdf5",

            border:
              "1px solid #b7ebd5",

            color:
              "#16845d",

            padding:
              "12px 15px",

            borderRadius:
              "9px",

            marginBottom:
              "18px",

            fontSize:
              "12px",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",
          }}
        >

          <CheckCircle2
            size={17}
          />

          <span>
            {message}
          </span>

        </div>

      )}


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div
          style={{
            background:
              "#fff1f2",

            border:
              "1px solid #fecdd3",

            color:
              "#c62828",

            padding:
              "12px 15px",

            borderRadius:
              "9px",

            marginBottom:
              "18px",

            fontSize:
              "12px",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",
          }}
        >

          <AlertCircle
            size={17}
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",

          gap:
            "18px",

          marginBottom:
            "20px",
        }}
      >

        {/* DOCUMENTS */}

        <div
          style={cardStyle}
        >

          <FileText
            size={22}
            color="#8250d6"
          />

          <p
            style={{
              color:
                "#7e8a9d",

              fontSize:
                "12px",

              margin:
                "14px 0 6px",
            }}
          >
            Documents
          </p>

          <h2
            style={{
              margin:
                0,

              color:
                "#17243c",

              fontSize:
                "26px",
            }}
          >
            {loading
              ? "..."
              : documents.length}
          </h2>

        </div>


        {/* CHUNKS */}

        <div
          style={cardStyle}
        >

          <Database
            size={22}
            color="#2879df"
          />

          <p
            style={{
              color:
                "#7e8a9d",

              fontSize:
                "12px",

              margin:
                "14px 0 6px",
            }}
          >
            Indexed Chunks
          </p>

          <h2
            style={{
              margin:
                0,

              color:
                "#17243c",

              fontSize:
                "26px",
            }}
          >
            {loading
              ? "..."
              : totalChunks}
          </h2>

        </div>


        {/* KNOWLEDGE STATUS */}

        <div
          style={cardStyle}
        >

          <BookOpen
            size={22}
            color="#8250d6"
          />

          <p
            style={{
              color:
                "#7e8a9d",

              fontSize:
                "12px",

              margin:
                "14px 0 6px",
            }}
          >
            AI Knowledge
          </p>

          <h2
            style={{
              margin:
                0,

              color:
                "#20a77d",

              fontSize:
                "22px",
            }}
          >
            {loading
              ? "..."
              : "Active"}
          </h2>

        </div>

      </div>


      {/* ======================================================
          KNOWLEDGE DOCUMENTS
      ====================================================== */}

      <div
        style={cardStyle}
      >

        {/* HEADER */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom:
              "15px",
          }}
        >

          <div>

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
              Knowledge Documents
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",

                color:
                  "#8994a6",

                fontSize:
                  "11px",
              }}
            >
              Documents available to
              OmniBrain retrieval.
            </p>

          </div>


          <span
            style={{
              color:
                "#8994a6",

              fontSize:
                "11px",
            }}
          >

            {filteredDocuments.length}{" "}

            document
            {filteredDocuments.length !==
            1
              ? "s"
              : ""}

          </span>

        </div>


        {/* SEARCH */}

        <div
          style={{
            position:
              "relative",

            marginBottom:
              "15px",
          }}
        >

          <Search
            size={17}
            style={{
              position:
                "absolute",

              left:
                "12px",

              top:
                "12px",

              color:
                "#8994a6",
            }}
          />


          <input
            type="text"
            placeholder="Search knowledge..."
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            style={{
              width:
                "100%",

              height:
                "40px",

              border:
                "1px solid #dfe5ed",

              borderRadius:
                "9px",

              paddingLeft:
                "38px",

              paddingRight:
                "38px",

              outline:
                "none",

              boxSizing:
                "border-box",

              fontSize:
                "12px",
            }}
          />


          {search && (

            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              style={{
                position:
                  "absolute",

                right:
                  "8px",

                top:
                  "8px",

                width:
                  "25px",

                height:
                  "25px",

                border:
                  "none",

                background:
                  "#f1f4f8",

                color:
                  "#7e8a9d",

                borderRadius:
                  "6px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                cursor:
                  "pointer",
              }}
            >

              <X
                size={14}
              />

            </button>

          )}

        </div>


        {/* DOCUMENT TYPE SUMMARY */}

        {!loading &&
          documents.length > 0 && (

            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",

                marginBottom:
                  "8px",

                flexWrap:
                  "wrap",
              }}
            >

              <span
                style={{
                  background:
                    "#f4f0ff",

                  color:
                    "#7650bd",

                  padding:
                    "5px 9px",

                  borderRadius:
                    "6px",

                  fontSize:
                    "10px",

                  fontWeight:
                    600,
                }}
              >
                PDF: {pdfCount}
              </span>


              <span
                style={{
                  background:
                    "#edf6ff",

                  color:
                    "#2879df",

                  padding:
                    "5px 9px",

                  borderRadius:
                    "6px",

                  fontSize:
                    "10px",

                  fontWeight:
                    600,
                }}
              >
                DOCX: {docxCount}
              </span>


              <span
                style={{
                  background:
                    "#ecfdf5",

                  color:
                    "#16845d",

                  padding:
                    "5px 9px",

                  borderRadius:
                    "6px",

                  fontSize:
                    "10px",

                  fontWeight:
                    600,
                }}
              >
                TXT: {txtCount}
              </span>

            </div>

          )}


        {/* LOADING */}

        {loading && (

          <div
            style={{
              textAlign:
                "center",

              padding:
                "50px 20px",

              color:
                "#8994a6",
            }}
          >

            <Loader2
              size={28}
              className="knowledge-spin"
            />

            <p>
              Loading knowledge...
            </p>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          filteredDocuments.length ===
            0 && (

            <div
              style={{
                textAlign:
                  "center",

                padding:
                  "50px 20px",

                color:
                  "#8994a6",
              }}
            >

              <FileText
                size={35}
                style={{
                  marginBottom:
                    "10px",

                  opacity:
                    0.6,
                }}
              />

              <p>

                {documents.length ===
                0
                  ? "No knowledge documents found."
                  : "No documents match your search."}

              </p>


              {documents.length ===
                0 && (

                <>

                  <small>
                    Upload a PDF, DOCX or
                    TXT document to build
                    your knowledge base.
                  </small>

                  <br />

                  <button
                    type="button"
                    onClick={
                      handleAddKnowledge
                    }
                    style={{
                      marginTop:
                        "15px",

                      border:
                        "none",

                      background:
                        "#1677df",

                      color:
                        "#fff",

                      padding:
                        "9px 14px",

                      borderRadius:
                        "8px",

                      cursor:
                        "pointer",

                      fontWeight:
                        600,

                      fontSize:
                        "11px",
                    }}
                  >

                    <Upload
                      size={14}
                      style={{
                        verticalAlign:
                          "middle",

                        marginRight:
                          "5px",
                      }}
                    />

                    Upload Document

                  </button>

                </>

              )}

            </div>

          )}


        {/* DOCUMENT LIST */}

        {!loading &&
          filteredDocuments.map(
            (
              document,
              index
            ) => {

              const isDeleting =
                deleting ===
                document.stored_name;


              return (

                <div
                  key={
                    document.id ||
                    document.stored_name ||
                    index
                  }
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "13px",

                    padding:
                      "16px 5px",

                    borderBottom:
                      index ===
                      filteredDocuments.length -
                        1
                        ? "none"
                        : "1px solid #f0f2f5",
                  }}
                >

                  {/* FILE ICON */}

                  <div
                    style={{
                      width:
                        "40px",

                      height:
                        "40px",

                      borderRadius:
                        "9px",

                      background:
                        "#edf6ff",

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

                    <FileText
                      size={19}
                      color="#2879df"
                    />

                  </div>


                  {/* DOCUMENT */}

                  <div
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,
                    }}
                  >

                    <strong
                      style={{
                        display:
                          "block",

                        color:
                          "#1d2940",

                        fontSize:
                          "12px",

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        whiteSpace:
                          "nowrap",
                      }}
                      title={
                        document.name
                      }
                    >
                      {document.name}
                    </strong>


                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          "10px",

                        marginTop:
                          "5px",

                        flexWrap:
                          "wrap",
                      }}
                    >

                      <span
                        style={{
                          color:
                            "#8994a6",

                          fontSize:
                            "10px",
                        }}
                      >
                        {document.type}
                      </span>


                      {document.chunks >
                        0 && (

                        <span
                          style={{
                            color:
                              "#8994a6",

                            fontSize:
                              "10px",
                          }}
                        >
                          {document.chunks} chunks
                        </span>

                      )}

                    </div>

                  </div>


                  {/* STATUS */}

                  <span
                    style={{
                      color:
                        "#20a77d",

                      fontSize:
                        "10px",

                      fontWeight:
                        700,

                      marginRight:
                        "8px",

                      whiteSpace:
                        "nowrap",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      gap:
                        "4px",
                    }}
                  >

                    <CheckCircle2
                      size={13}
                    />

                    {document.status ||
                      "Indexed"}

                  </span>


                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        document
                      )
                    }
                    disabled={
                      isDeleting ||
                      uploading
                    }
                    title="Delete document"
                    style={{
                      border:
                        "none",

                      background:
                        isDeleting
                          ? "#f3f4f6"
                          : "transparent",

                      color:
                        "#dc3545",

                      cursor:
                        isDeleting ||
                        uploading
                          ? "not-allowed"
                          : "pointer",

                      padding:
                        "7px",

                      borderRadius:
                        "7px",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",
                    }}
                  >

                    {isDeleting ? (

                      <Loader2
                        size={17}
                        className="knowledge-spin"
                      />

                    ) : (

                      <Trash2
                        size={17}
                      />

                    )}

                  </button>

                </div>

              );

            }
          )}

      </div>


      {/* ======================================================
          SECURITY / STATUS
      ====================================================== */}

      <div
        style={{
          marginTop:
            "20px",

          background:
            "#f8fbff",

          border:
            "1px solid #dcecff",

          borderRadius:
            "14px",

          padding:
            "17px 18px",

          display:
            "flex",

          alignItems:
            "center",

          gap:
            "12px",
        }}
      >

        <ShieldCheck
          size={20}
          color="#2879df"
        />


        <div>

          <strong
            style={{
              fontSize:
                "12px",

              color:
                "#1d2940",
            }}
          >
            Knowledge indexing active
          </strong>


          <p
            style={{
              margin:
                "4px 0 0",

              color:
                "#7e8a9d",

              fontSize:
                "10px",
            }}
          >
            OmniBrain automatically refreshes
            the knowledge base every 10 seconds.
          </p>

        </div>

      </div>


      {/* ======================================================
          STYLES
      ====================================================== */}

      <style>
        {`

          .knowledge-spin {
            animation:
              knowledgeSpin
              1s linear infinite;
          }

          @keyframes knowledgeSpin {

            from {
              transform:
                rotate(0deg);
            }

            to {
              transform:
                rotate(360deg);
            }

          }

          @media (max-width: 900px) {

            .ob-header {
              flex-direction:
                column;

              align-items:
                flex-start;
            }

          }

          @media (max-width: 700px) {

            .knowledge-summary {
              grid-template-columns:
                1fr;
            }

          }

        `}
      </style>

    </div>

  );

}


export default Knowledge;

