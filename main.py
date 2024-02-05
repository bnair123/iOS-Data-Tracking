import requests
import pandas as pd
import matplotlib.pyplot as plt
from ftplib import FTP
from email.message import EmailMessage
import smtplib
import paramiko
import os
from datetime import datetime

# Replace these URLs with the actual URLs of your API
USAGE_ENDPOINT = 'https://URL/dataUsage/get-usage'
STATS_ENDPOINT = 'https://URL/dataUsage/get-stats'

# FTP server details
FTP_SERVER = 'ADDRESS'
FTP_USERNAME = 'USERNAME'
FTP_PASSWORD = 'PASSWORD'
FTP_PATH =

# Email details
SMTP_SERVER = 'smtp'
SMTP_PORT = 587  # Typically 465 for SSL or 587 for TLS
SMTP_USERNAME =
SMTP_PASSWORD =
RECEIVER_EMAIL =


def fetch_data(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch data from {url}")
        return None


def upload_to_sftp(filename):
    transport = paramiko.Transport((FTP_SERVER, 22))
    transport.connect(username=FTP_USERNAME, password=FTP_PASSWORD)

    sftp = paramiko.SFTPClient.from_transport(transport)
    remote_path = os.path.join(FTP_PATH, os.path.basename(filename))
    sftp.put(filename, remote_path)
    sftp.close()
    transport.close()


def plot_data_usage(usage_data, stats_data):
    # Existing plotting code (unchanged)

    # Get the last date from the usage data for naming the file
    last_date = pd.to_datetime(usage_data['usage'][-1]['date']).strftime('%Y%m%d')
    filename = f'Stats{last_date}.png'

    # Save the plot to a file
    plt.savefig(filename, bbox_inches='tight')  # Save the figure
    plt.close()  # Close the plotting window
    return filename


def send_email(subject, body):
    msg = EmailMessage()
    msg['From'] = SMTP_USERNAME
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = subject
    msg.set_content(body)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.ehlo()  # Can be omitted
        server.starttls()  # Secure the connection
        server.ehlo()  # Can be omitted
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)


if __name__ == '__main__':
    usage_data = fetch_data(USAGE_ENDPOINT)
    stats_data = fetch_data(STATS_ENDPOINT)
    if usage_data and stats_data:
        filename = plot_data_usage(usage_data, stats_data)
        upload_to_sftp(filename)
        file_link = f'https://URL/dataUsage/{os.path.basename(filename)}'
        send_email('Monthly Data Usage Stats', f'Your monthly stats are available here: {file_link}')