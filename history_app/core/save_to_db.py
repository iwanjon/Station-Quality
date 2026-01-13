from typing import List
from fastapi import HTTPException
import matplotlib
# matplotlib.use('tkagg')
# matplotlib.use("Agg")
from matplotlib.gridspec import GridSpec
import pandas as pd
import numpy as np
from obspy import UTCDateTime, read_inventory
from obspy.clients.fdsn import Client
import io
import urllib.request
import os
from obspy.core.inventory.response import CoefficientsTypeResponseStage
from obspy.core.inventory.response import PolesZerosResponseStage
import matplotlib.pyplot as plt

from datetime import datetime
import logging
from config import settings
from obspy.core.inventory.response import Response, _adjust_bode_plot_figure
import textwrap
from obspy.core.util.obspy_types import (ComplexWithUncertainties,
                                         FloatWithUncertainties,
                                         FloatWithUncertaintiesAndUnit,
                                         ObsPyException,
                                         ZeroSamplingRate)
from matplotlib.figure import Figure

from static_variable import (
                        STATIC,
                        RESPONSE_PATH,
                        RESPONSE_PATH_URL,
                        BASE_DIR,
                        STATIC_FOLDER 
                        )

log = logging.getLogger(__name__)

# Get the current datetime
current_datetime = datetime.now()

# Convert datetime to timestamp
timestamp_float = current_datetime.timestamp()



class Custome_Response(Response):
    """
    The root response object.
    """
    def __init__(self, response:Response):
        """
        :type resource_id: str
        :param resource_id: This field contains a string that should serve as a
            unique resource identifier. This identifier can be interpreted
            differently depending on the data center/software that generated
            the document. Also, we recommend to use something like
            GENERATOR:Meaningful ID. As a common behavior equipment with the
            same ID should contains the same information/be derived from the
            same base instruments.
        :type instrument_sensitivity:
            :class:`~obspy.core.inventory.response.InstrumentSensitivity`
        :param instrument_sensitivity: The total sensitivity for the given
            channel, representing the complete acquisition system expressed as
            a scalar.
        :type instrument_polynomial:
            :class:`~obspy.core.inventory.response.InstrumentPolynomial`
        :param instrument_polynomial: The total sensitivity for the given
            channel, representing the complete acquisition system expressed as
            a polynomial.
        :type response_stages: list of
            :class:`~obspy.core.inventory.response.ResponseStage` objects
        :param response_stages: A list of the response stages. Covers SEED
            blockettes 53 to 56.
        """
       
        # def __init__(self, resource_id=None, instrument_sensitivity=None, instrument_polynomial=None, response_stages=None):
        super().__init__( resource_id=response.resource_id, instrument_sensitivity=response.instrument_sensitivity, instrument_polynomial=response.instrument_polynomial, response_stages=response.response_stages)
        # self.resource_id = response.resource_id
      
        # self.instrument_sensitivity = response.instrument_sensitivity
        # self.instrument_polynomial = response.instrument_polynomial
        # if response.response_stages is None:
        #     self.response_stages = []
        # elif hasattr(response.response_stages, "__iter__"):
        #     self.response_stages = response.response_stages
        # else:
        #     msg = "response_stages must be an iterable."
        #     raise ValueError(msg)
    

    def plot(self, min_freq, output="VEL", start_stage=None,
             end_stage=None, label=None, axes=None, sampling_rate=None,
             unwrap_phase=False, plot_degrees=False, show=True, outfile=None):
        """
        Show bode plot of instrument response.

        :type min_freq: float
        :param min_freq: Lowest frequency to plot.
        :type output: str
        :param output: Output units. One of:

            ``"DISP"``
                displacement, output unit is meters
            ``"VEL"``
                velocity, output unit is meters/second
            ``"ACC"``
                acceleration, output unit is meters/second**2
            ``"DEF"``
                default units, the response is calculated in
                output units/input units (last stage/first stage).
                Useful if the units for a particular type of sensor (e.g., a
                pressure sensor) cannot be converted to displacement, velocity
                or acceleration.

        :type start_stage: int, optional
        :param start_stage: Stage sequence number of first stage that will be
            used (disregarding all earlier stages).
        :type end_stage: int, optional
        :param end_stage: Stage sequence number of last stage that will be
            used (disregarding all later stages).
        :type label: str
        :param label: Label string for legend.
        :type axes: list of 2 :class:`matplotlib.axes.Axes`
        :param axes: List/tuple of two axes instances to plot the
            amplitude/phase spectrum into. If not specified, a new figure is
            opened.
        :type sampling_rate: float
        :param sampling_rate: Manually specify sampling rate of time series.
            If not given it is attempted to determine it from the information
            in the individual response stages.  Does not influence the spectra
            calculation, if it is not known, just provide the highest frequency
            that should be plotted times two.
        :type unwrap_phase: bool
        :param unwrap_phase: Set optional phase unwrapping using NumPy.
        :type plot_degrees: bool
        :param plot_degrees: if ``True`` plot bode in degrees
        :type show: bool
        :param show: Whether to show the figure after plotting or not. Can be
            used to do further customization of the plot before showing it.
        :type outfile: str
        :param outfile: Output file path to directly save the resulting image
            (e.g. ``"/tmp/image.png"``). Overrides the ``show`` option, image
            will not be displayed interactively. The given path/filename is
            also used to automatically determine the output format. Supported
            file formats depend on your matplotlib backend.  Most backends
            support png, pdf, ps, eps and svg. Defaults to ``None``.

        .. rubric:: Basic Usage

        >>> from obspy import read_inventory
        >>> resp = read_inventory()[0][0][0].response
        >>> resp.plot(0.001, output="VEL")  # doctest: +SKIP

        .. plot::

            from obspy import read_inventory
            resp = read_inventory()[0][0][0].response
            resp.plot(0.001, output="VEL")
        """
        import matplotlib.pyplot as plt
        from matplotlib.transforms import blended_transform_factory

        # detect sampling rate from response stages
        if sampling_rate is None:
            for stage in self.response_stages[::-1]:
                if (stage.decimation_input_sample_rate is not None and
                        stage.decimation_factor is not None):
                    sampling_rate = (stage.decimation_input_sample_rate /
                                     stage.decimation_factor)
                    break
            else:
                msg = ("Failed to autodetect sampling rate of channel from "
                       "response stages. Please manually specify parameter "
                       "`sampling_rate`")
                raise Exception(msg)
        if sampling_rate == 0:
            msg = "Can not plot response for channel with sampling rate `0`."
            raise ZeroSamplingRate(msg)

        t_samp = 1.0 / sampling_rate
        nyquist = sampling_rate / 2.0
        nfft = int(sampling_rate / min_freq)

        cpx_response, freq = self.get_evalresp_response(
            t_samp=t_samp, nfft=nfft, output=output, start_stage=start_stage,
            end_stage=end_stage)

        if axes is not None:
            ax1, ax2 = axes
            fig = ax1.figure
        else:
            




            high = 6
            fig = plt.figure(figsize=(2*high, high))
            ax1 = fig.add_subplot(211)
            ax2 = fig.add_subplot(212, sharex=ax1)
     
        label_kwarg = {}
        if label is not None:
            label_kwarg['label'] = label

        # plot amplitude response
        lw = 1.5
        lines = ax1.loglog(freq, abs(cpx_response), lw=lw, **label_kwarg)
        color = lines[0].get_color()
        if self.instrument_sensitivity:
            trans_above = blended_transform_factory(ax1.transData,
                                                    ax1.transAxes)
            trans_right = blended_transform_factory(ax1.transAxes,
                                                    ax1.transData)
            arrowprops = dict(
                arrowstyle="wedge,tail_width=1.4,shrink_factor=0.8", fc=color)
            bbox = dict(boxstyle="round", fc="w")
            if self.instrument_sensitivity.frequency:
                ax1.annotate("%.1g" % self.instrument_sensitivity.frequency,
                             (self.instrument_sensitivity.frequency, 1.0),
                             xytext=(self.instrument_sensitivity.frequency,
                                     1.1),
                             xycoords=trans_above, textcoords=trans_above,
                             ha="center", va="bottom",
                             arrowprops=arrowprops, bbox=bbox)
            if self.instrument_sensitivity.value:
                ax1.annotate("%.1e" % self.instrument_sensitivity.value,
                             (1.0, self.instrument_sensitivity.value),
                             xytext=(1.05, self.instrument_sensitivity.value),
                             xycoords=trans_right, textcoords=trans_right,
                             ha="left", va="center",
                             arrowprops=arrowprops, bbox=bbox)

        # plot phase response
        phase = np.angle(cpx_response, deg=plot_degrees)
        if unwrap_phase and not plot_degrees:
            phase = np.unwrap(phase)
        ax2.semilogx(freq, phase, color=color, lw=lw)

        # plot nyquist frequency
        for ax in (ax1, ax2):
            ax.axvline(nyquist, ls="--", color=color, lw=lw)

        # # Multi-line description text
        # description_text = (
        #     "This is a multi-line description.\n"
        #     "It will explain different aspects\n"
        #     "of the data or plot in detail."
        # )

        # # Add multi-line description to the right of the plot
        # ax.annotate(description_text,
        #             xy=(0.95, 0.5),  # Position on the right side
        #             xycoords='axes fraction',  # Use axes fraction for positioning
        #             ha="left", va="center",
        #             fontsize=12, color='black', fontweight='bold',
        #             bbox=dict(facecolor='white', edgecolor='black', boxstyle='round,pad=0.5'))


        # Long description that should dynamically wrap
        description = """
        This is a long description text that explains the data shown in the plots.
        It can adjust dynamically as the content changes, making sure it stays
        well-positioned next to the plots without being cut off. The description
        text will adjust automatically when content changes, and Matplotlib will
        ensure it remains visible to the right of the plots.
        """

        # Use textwrap to break the text into lines that will fit
        wrapped_description = textwrap.fill(description, width=20)  # Wrap text at 50 characters

        # Add the description to the right of the subplots
        # fig.text(0.78, 0.5, wrapped_description, ha='left', va='center', fontsize=12)
        # Adding the text next to the plot dynamically
        fig.text(0.75, 0.5, wrapped_description, ha='left', va='center', fontsize=12,
         color='black', fontweight='bold', bbox=dict(facecolor='white', edgecolor='black', boxstyle='round,pad=0.5'))



        # only do adjustments if we initialized the figure in here
        if not axes:
            _adjust_bode_plot_figure(fig, show=False,
                                     plot_degrees=plot_degrees)

     
        plt.subplots_adjust(right=0.6)
        if outfile:
            fig.savefig(outfile)
        else:
            if show:
                plt.show()

        return fig



def download_inventory_from_api(station_code: str):
    url = settings.INV_URL
    url = url.format(station_code=station_code)
    try:
        with urllib.request.urlopen(url) as response:
            inv_data = response.read()
            inv = read_inventory(io.BytesIO(inv_data))

            return inv
    except Exception as e:
        print(f"❌ Gagal mengambil response dari API untuk stasiun {station_code}: {e}")
        return None

def calculate_rms_and_mean(tr):
    data = tr.data
    rms = np.sqrt(np.mean(data ** 2))
    mean = np.mean(data)
    return rms, mean

def ensure_folders():
    os.makedirs("plots/count", exist_ok=True)
    os.makedirs("plots/ms", exist_ok=True)
    os.makedirs("plots/volt", exist_ok=True)
    os.makedirs("plots/ms_2", exist_ok=True)
    os.makedirs("plots/ms_2_no_filter", exist_ok=True)

def process_waveform_plot(
    station_file: str,
    network: str = "IA",
    start_datetime: str = "2024-03-09T06:00:00",
    end_datetime: str = "2024-03-10T06:00:00",
    save_response = None
):
    # ensure_folders()

    df = pd.read_excel(station_file)


    # Kolom output
    col_prefixes = ['rms_count_', 'mean_count_', 'rms_ms_', 'mean_ms_', 'rms_volt_', 'mean_volt_']
    components = ['Z', 'N', 'E']
    for comp in components:
        for prefix in col_prefixes:
            col_name = prefix + comp
            if col_name not in df.columns:
                df[col_name] = np.nan

    data_list = []
    for idx, row in df.iterrows():
        station_code = row['sta']
        print(f"📡 Memproses stasiun: {station_code}")
        print(f"📡 stasiun ke {idx + 1} dari {len(df)}")
        try:
            # st = client.get_waveforms(
            #     network=network,
            #     station=station_code,
            #     location="*",
            #     channel="SH?",
            #     starttime=start_dt,
            #     endtime=end_dt,
            #     attach_response=True
            # )

            inv = download_inventory_from_api(station_code)
            if inv is None:
                continue


            station_list = instrument_meta(inv, station_code, save_response=save_response)
         
            data_list += station_list
            print(f"✅ {station_code} selesai")
            
        except Exception as e:
            print(f"❌ Gagal memproses {station_code}: {e}")

    # # Simpan hasil akhir
    # output_excel = "hasil_rms_mean_per_channel.xlsx"
    # df.to_excel(output_excel, index=False)
    # print(data_list)
    create_xlsx(data_list)
    
    return data_list
    # print(f"📄 Hasil disimpan ke {output_excel}")
    
    
def get_station_history(
    station_code: str,
    save_response = None

):
    inv = download_inventory_from_api(station_code)
    if inv is None:
        raise HTTPException(status_code=400, detail='stasiun inventory not found.')

    station_list = instrument_meta(inv, station_code, save_response=save_response)

    # print(station_list)
    return station_list
    # print(f"📄 Hasil disimpan ke {output_excel}")

def get_station_location(
    station_code: str,

):
    inv = download_inventory_from_api(station_code)
    if inv is None:
        raise HTTPException(status_code=400, detail='stasiun inventory not found.')

    # from pdb import set_trace as sstt
    # sstt()
    
    station_location = []
    station_latitude = inv[0][0].latitude or 0
    station_longitude = inv[0][0].longitude or 0
    station_elevation = inv[0][0].elevation or 0
    
    station_location.append(station_latitude)
    station_location.append(station_longitude)
    station_location.append(station_elevation)
    
    return station_location


def get_polesZerosResponseStage(inv, tr):
    tr.attach_response(inv)
    # print(tr.stats.response) 

    resp_stages = tr.stats.response.response_stages
    
    for i in resp_stages:
        # if isinstance(i, PolesZerosResponseStage):
        if i.stage_gain > 10 and i.stage_gain < 3000:
            stage_gain = i.stage_gain
            # print(" === Stage 1: PolesZerosResponseStage from m/s to V, gain: {} === ".format(stage_gain))
            return stage_gain


def get_coefficientsTypeResponseStagee(inv, tr):
    tr.attach_response(inv)
    # print(tr.stats.response) 
    # tr.stats.response.instrument_sensitivity

    resp_stages = tr.stats.response.response_stages
    
    for i in resp_stages:
        # if isinstance(i, CoefficientsTypeResponseStage):
        if i.stage_gain > 100000:
            stage_gain = i.stage_gain
            # print(" === Stage 2: CoefficientsTypeResponseStage from V to COUNTS, gain: {} === ".format(stage_gain))
            return stage_gain


def get_stage_gain(channel):

    resp_stages = channel.response.response_stages 
    
    stages = 1

    for idx , i in enumerate(resp_stages):

        stages *= i.stage_gain
        # print(" === Stage gain: {} = {} total stage gain {} === ".format(idx, i.stage_gain, stages))

    return stages


# def get_vars_safe(obj, attr):
#     try:
#         return vars(getattr(obj, attr)())
#     except Exception:
#         return None

def get_vars_safe(obj, attr_path):
    try:
        # Split the attribute path into a list
        attrs = attr_path.split('.')
        
        # Traverse each attribute in the path
        for attr in attrs:
            obj = getattr(obj, attr)
        
        # If the final attribute is callable, call it and then return vars
        if callable(obj):
            obj = obj()
        
        return vars(obj)
    except Exception:
        return None

def get_type_safe(data_dict, get_type_func):

    return get_type_func(data_dict) if data_dict else ""

def pole_zero_text_formating(_zeros,_poles,gain):
    # _zeros = [0j, 0j]
    # _poles = [(-0.03702 + 0.03702j), (-0.03702 - 0.03702j), (-177.72 + 177.72j), (-177.72 - 177.72j)]
    # gain = 12344999999999999

    # Format _zeros and _poles as multi-line strings
    zeros_str = "\n".join(str(zero) for zero in _zeros)  # Join zeros with newlines
    poles_str = "\n".join(str(pole) for pole in _poles)  # Join poles with newlines

    # Create the text in 3 columns
    text = f"{'Zero(s)':<20}{'Pole(s)':<35}{'Gain':<15}\n"
    text += "-" * 70 + "\n"

    # Split the zeros, poles, and gain into lines of the same length
    zeros_lines = zeros_str.split("\n")
    poles_lines = poles_str.split("\n")

    # Max length of the lines for columns
    max_len = max(len(zeros_lines), len(poles_lines))

    # Ensure all lists are of the same length by padding with empty strings if necessary
    zeros_lines += [''] * (max_len - len(zeros_lines))
    poles_lines += [''] * (max_len - len(poles_lines))

    # Add the zeros, poles, and gain on the first line
    for i in range(max_len):
        # On the first line, include gain under the "Gain" column, otherwise just print zeros and poles
        if i == 0:
            text += f"{zeros_lines[i]:<20}{poles_lines[i]:<35}{gain:<15}\n"
        else:
            text += f"{zeros_lines[i]:<20}{poles_lines[i]:<15}\n"

    # Print the final result
    # print(text)

    # # Add the gain value directly under the "Gain" column header (in the first line)
    # text += f"{'':<20}{'':<50}{gain:<10}\n"

    # # Combine the columns line by line
    # for i in range(max_len):
    #     text += f"{zeros_lines[i]:<20}{poles_lines[i]:<50}\n"

    # # Print the final result


    # # Combine the columns line by line, ensuring that gain is printed only on the last line
    # for i in range(max_len):
    #     if i == max_len - 1:  # On the last line, add the gain
    #         text += f"{zeros_lines[i]:<20}{poles_lines[i]:<50}{gain:<10}\n"
    #     else:
    #         text += f"{zeros_lines[i]:<20}{poles_lines[i]:<50}\n"

    # # Print the final result
    # print(text)
    return text

list_of_symbol=[":","-","_","/",","," ","(",")","[","]","{","}"]

def replace_symbol(word:str):
    for i in list_of_symbol:
        word = word.replace(i, "")
    return word    
    
    
def instrument_meta(inv, sta, save_response=None):
    channel_full_data = []
    for i in inv.networks[0].stations[0].channels:
        # asd:Response = inv.networks[0].stations[0].channels[0].response 
        # asd:Response = i.response 
        # aaa = Custome_Response(asd)
   
        # try:
        # paz_det =   vars(i.response.get_paz())  
        # dict_data_logger = vars(i.data_logger)
        # dict_sensor = vars(i.sensor)
        sampling_rate =   i.sample_rate or 0
        paz_det =   get_vars_safe(i, "response.get_paz")
        dict_data_logger = get_vars_safe(i, "data_logger")
        dict_sensor = get_vars_safe(i, "sensor")
    
        # datalogger_type = str(dict_data_logger.get("manufacturer")) +"_"+ str(dict_data_logger.get("type"))
        # sensor_type = str(dict_sensor.get("model")) +"_"+ str(dict_sensor.get("type"))
        sensor_type = get_type_safe(dict_sensor,get_sensor_type )
        datalogger_type = get_type_safe(dict_data_logger,get_digitizer_type )
        # sensor_type = get_sensor_type(dict_sensor)
        # datalogger_type = get_digitizer_type(dict_data_logger)
        code =  i.code
        final_constant = get_stage_gain(i)
        latitude = i._latitude
        longitude = i._longitude
        elevation = i._elevation
        file_name = sta+"_"+code+"_"+replace_symbol(str(sensor_type))+"_"+replace_symbol(str(datalogger_type))+"_"+str(int(final_constant))
        print(file_name)
        if save_response:
            file_path = os.path.join(STATIC_FOLDER, file_name+".jpg")
            print(file_path, STATIC_FOLDER)
            try:
                plt.close("all")
                respo:Response = i.response
                figur:Figure|any = respo.plot(0.001, outfile=file_path)
                figur.clear()
                del figur
                plt.close()
                plt.close("all")
            except Exception as e:
                log.error(e)
                file_name=None
        # aaa.plot(0.01, outfile=file_name+".jpg")

        try:
            channel_data =  [
                    sta,
                    code, 
                    sensor_type, 
                    datalogger_type,
                    final_constant,
                    i.response.instrument_sensitivity.input_units,
                    i.start_date,
                    i.end_date,
                    0 if i.end_date else 1, 
                    latitude,
                    longitude,
                    elevation,
                    sampling_rate,
                    paz_det,
                    STATIC+"/"+RESPONSE_PATH_URL+file_name+".jpg" if file_name else None
                    ]
            channel_full_data.append(channel_data)
        except Exception as e:
            log.info(" ======== error in ========= error : {} , channel : {} , response :{}".format(e, vars(i), vars(i.response)))

    
    plt.close("all")
    return channel_full_data
    # return channel_data


    # import pandas as pd

    # data = [['Alice', 25, 'New York'], ['Bob', 30, 'London'], ['Charlie', 22, 'Paris']]
    # df = pd.DataFrame(data, columns=['Name', 'Age', 'City'])
    # print(df)

def create_xlsx(data_list:List):

    df = pd.DataFrame(data_list, columns=[
                                        "sta",
                                          'Channel', 
                                          'Sensor', 
                                          "Digitizer", 
                                          "final constant",
                                          "input unit",
                                          "start_date",
                                          "end_date",
                                          "status",
                                            "latitude",
                                            "longitude",
                                            "elevation",
                                          "sampling_rate",
                                          "paz"
                                          ])
    df.to_excel('all'+str(int(timestamp_float))+".xlsx", index=False) # index=False prevents writing the DataFrame index to Excel

def get_digitizer_type(dict_data_logger):
    # datalogger_type =""

    # if not dict_data_logger.get("manufacturer") and not dict_data_logger.get("type"):
    #     datalogger_type = "NRL/Quanterra/Q330Splus.1.40.below100"
    # elif not dict_data_logger.get("manufacturer"):
    #     datalogger_type = str(dict_data_logger.get("type"))
    # elif not dict_data_logger.get("type"):
    #     datalogger_type = str(dict_data_logger.get("manufacturer")) 
    # else:
    #     datalogger_type = str(dict_data_logger.get("manufacturer")) +"_"+ str(dict_data_logger.get("type"))
    

    datalogger_type = get_priority_value(dict_data_logger, priority_keys)
    # from pdb import set_trace as sstt
    # sstt()
    return datalogger_type

def get_sensor_type(dict_sensor):
        # sensor_type = ""
        # if not dict_sensor.get("model") and not dict_sensor.get("type"):
        #     sensor_type = ""
        # elif not dict_sensor.get("model"):
        #     sensor_type = str(dict_sensor.get("type"))
        # elif not dict_sensor.get("type"):
        #     sensor_type = str(dict_sensor.get("model")) 
        # else:
        #     sensor_type = str(dict_sensor.get("model")) +"_"+ str(dict_sensor.get("type"))

        sensor_type = get_priority_value(dict_sensor, priority_keys)
        # from pdb import set_trace as sstt
        # sstt()
        return sensor_type

priority_keys = ["manufacturer", "vendor", "type", "resource_id"]

def get_priority_value(data, keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, "", []):
            return value
    return ""

# def get_data_save_to_db(inv, tr):
#     channel = tr.stats.channel
#     network = tr.stats.network
#     input_unit = tr.stats.response.instrument_sensitivity.input_units
#     station_name =  tr.stats.station
    
#     instrument_constant = get_polesZerosResponseStage(inv, tr)

#     datalogger_constant = get_coefficientsTypeResponseStagee(inv, tr)

#     final_constant = get_stage_gain(inv, tr)
#     rms, mean  = calculate_rms_and_mean(tr)
#     for i in inv.networks[0].stations[0].channels:
#         end_date =  i.end_date 
#         start_date =  i.start_date 
#         dict_data_logger = vars(i.data_logger)
#         dict_sensor = vars(i.sensor)

#         # datalogger_type = str(dict_data_logger.get("manufacturer")) +"_"+ str(dict_data_logger.get("type"))
#         # sensor_type = str(dict_sensor.get("model")) +"_"+ str(dict_sensor.get("type"))
#         sensor_type = get_sensor_type(dict_sensor)
#         datalogger_type = get_digitizer_type(dict_data_logger)
        
#         return [
#                 station_name, 
#                 channel, 
#                 sensor_type, 
#                 instrument_constant,
#                 datalogger_type,
#                 datalogger_constant,
#                 mean, 
#                 mean / datalogger_constant, 
#                 mean / (instrument_constant * datalogger_constant),
#                 rms,
#                 network, 
#                 input_unit,
#                 final_constant
#                 ]
#     return False


# if __name__ == "__main__":
#     process_waveform_plot(
#         station_file="stasiun.xlsx",
#         network="IA",
#         # start_datetime="2025-08-04T17:00:00",
#         start_datetime="2025-08-07T12:00:00",
#         end_datetime="2025-08-07T17:00:00"
#     )


# inv[0]._stations[0].channels[0].data_logger.__dict__
# inv[0]._stations[0].channels[0].sensor.__dict__

# [ (i._code, i.start_date, i.end_date ,i._sample_rate, i._latitude, i._longitude , i._elevation , i._depth, i._azimuth, i._dip ) for i in inv.networks[0].stations[0].channels]
# nama dataloger, merek sensor

#  inv[0]._stations[0].channels[0].response.instrument_sensitivity.input_units



    # tr.attach_response(inv)
    # print(tr.stats.response) 
    # # tr.stats.response.instrument_sensitivity

    # resp_stages = tr.stats.response.response_stages


# staion_name =  tr.stats.station
# input_unit = tr.stats.response.instrument_sensitivity.input_units
# network = dict(tr.meta).get("network")
# channel = dict(tr.meta).get("channel")
# end_date = vars(inv[0]._stations[0].channels[6]).get("end_date")  
# channel  = tr.stats.channel

# try:
#     paz_det =   vars(i.response.get_paz())  
# except Exception as e:
#     paz_det = None

# try:
#     dict_data_logger = vars(i.data_logger) 
# except Exception as e:
#     dict_data_logger = None

# try:
#     dict_sensor = vars(i.sensor)
# except Exception as e:
#     dict_sensor = None


# if dict_sensor:
#     sensor_type = get_sensor_type(dict_sensor)
# else:
#     sensor_type = ""
# if dict_data_logger:
#     datalogger_type = get_digitizer_type(dict_data_logger)
# else:
#     datalogger_type = ""