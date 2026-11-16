package com.geosurfer.ai

import android.Manifest
import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingOrigin: String? = null
    private var pendingCallback: GeolocationPermissions.Callback? = null

    private val locationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            pendingCallback?.invoke(pendingOrigin, granted, false)
            pendingCallback = null
            pendingOrigin = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            setGeolocationEnabled(true)
        }
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                pendingOrigin = origin
                pendingCallback = callback
                locationPermission.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            }
        }

        // HTTPS base URL so geolocation (secure origin) and tile requests work.
        val coords = assets.open("coords.js").bufferedReader().use { it.readText() }
        val html = assets.open("map.html").bufferedReader().use { it.readText() }
            .replace("/*COORDS_JS*/", coords)
        webView.loadDataWithBaseURL("https://geosurfer.local/", html, "text/html", "UTF-8", null)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                finish()
            }
        })
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
